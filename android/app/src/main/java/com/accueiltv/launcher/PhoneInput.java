package com.accueiltv.launcher;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Collections;
import java.util.Locale;

/**
 * « Saisir depuis mon téléphone » : petit serveur web local, sur le Wi-Fi de la maison uniquement.
 * Le téléphone ouvre http://IP-de-la-TV:port/code (affiché en QR code), remplit le formulaire
 * et l'envoie. La TV reçoit le texte directement : aucun service extérieur n'est utilisé.
 * Le code est aléatoire, la page ne sert qu'une fois et s'arrête d'elle-même au bout de 10 minutes.
 */
class PhoneInput {

    interface Listener {
        void onReceived(String json);
        void onEnded();
    }

    private static final long TIMEOUT_MS = 10 * 60 * 1000;
    private static final int MAX_BODY = 16 * 1024;

    private final Listener listener;
    private ServerSocket server;
    private Thread thread;
    private String token;
    private JSONObject form;
    private volatile boolean running;

    PhoneInput(Listener listener) { this.listener = listener; }

    /** Démarre la page et renvoie {ok, url} ou {ok:false, error}. */
    synchronized String start(String formJson) {
        stop();
        JSONObject res = new JSONObject();
        try {
            form = new JSONObject(formJson);
            String ip = localIp();
            if (ip == null) {
                res.put("ok", false);
                res.put("error", "La TV n’est pas connectée au réseau de la maison.");
                return res.toString();
            }
            byte[] rnd = new byte[9];
            new SecureRandom().nextBytes(rnd);
            StringBuilder sb = new StringBuilder();
            for (byte b : rnd) sb.append(String.format(Locale.ROOT, "%02x", b));
            token = sb.toString();
            server = new ServerSocket(0);
            server.setSoTimeout(1000);
            running = true;
            final long until = System.currentTimeMillis() + TIMEOUT_MS;
            final ServerSocket s = server;
            thread = new Thread(() -> loop(s, until), "saisie-telephone");
            thread.setDaemon(true);
            thread.start();
            res.put("ok", true);
            res.put("url", "http://" + ip + ":" + server.getLocalPort() + "/" + token);
        } catch (Exception e) {
            stop();
            try { res.put("ok", false); res.put("error", "Impossible de démarrer la saisie depuis le téléphone."); } catch (Exception ignored) { }
        }
        return res.toString();
    }

    synchronized void stop() {
        running = false;
        if (server != null) { try { server.close(); } catch (Exception ignored) { } }
        server = null;
    }

    private void loop(ServerSocket s, long until) {
        boolean received = false;
        while (running && !s.isClosed() && System.currentTimeMillis() < until) {
            try (Socket c = s.accept()) {
                c.setSoTimeout(8000);
                if (handle(c)) { received = true; break; }
            } catch (java.net.SocketTimeoutException ignored) {
                // on revérifie le délai
            } catch (Exception e) {
                if (s.isClosed()) break;
            }
        }
        boolean wasRunning = running;
        try { s.close(); } catch (Exception ignored) { }
        synchronized (this) { if (server == s) { server = null; running = false; } }
        if (!received && wasRunning) listener.onEnded();
    }

    /** Traite une requête ; renvoie true quand le formulaire a été reçu. */
    private boolean handle(Socket c) throws Exception {
        InputStream in = c.getInputStream();
        ByteArrayOutputStream head = new ByteArrayOutputStream();
        int prev3 = 0, b;
        while ((b = in.read()) != -1) { // en-têtes jusqu'à la ligne vide
            head.write(b);
            prev3 = (prev3 << 8 | b) & 0xFFFFFFFF;
            if (prev3 == 0x0D0A0D0A) break;
            if (head.size() > 8192) { reply(c, 431, "text/plain", "Trop long"); return false; }
        }
        String[] lines = head.toString("ISO-8859-1").split("\r\n");
        String[] req = lines[0].split(" ");
        if (req.length < 2) return false;
        String method = req[0], path = req[1];
        int q = path.indexOf('?');
        if (q >= 0) path = path.substring(0, q);
        if (!path.equals("/" + token)) { reply(c, 404, "text/plain; charset=utf-8", "Page introuvable ou expirée."); return false; }
        if (method.equals("GET")) { reply(c, 200, "text/html; charset=utf-8", page()); return false; }
        if (!method.equals("POST")) { reply(c, 405, "text/plain", "Non"); return false; }

        int len = 0;
        for (String l : lines) {
            if (l.toLowerCase(Locale.ROOT).startsWith("content-length:")) {
                try { len = Integer.parseInt(l.substring(15).trim()); } catch (Exception ignored) { }
            }
        }
        if (len <= 0 || len > MAX_BODY) { reply(c, 413, "text/plain; charset=utf-8", "Texte trop long."); return false; }
        byte[] body = new byte[len];
        int off = 0;
        while (off < len) { int n = in.read(body, off, len - off); if (n < 0) break; off += n; }

        JSONObject out = new JSONObject();
        JSONArray fields = form.optJSONArray("fields");
        String data = new String(body, 0, off, StandardCharsets.UTF_8);
        for (String pair : data.split("&")) {
            int eq = pair.indexOf('=');
            if (eq <= 0) continue;
            String k = URLDecoder.decode(pair.substring(0, eq), "UTF-8");
            String v = URLDecoder.decode(pair.substring(eq + 1), "UTF-8");
            if (fields != null) for (int i = 0; i < fields.length(); i++) {
                JSONObject f = fields.getJSONObject(i);
                if (f.optString("id").equals(k)) out.put(k, v.length() > 500 ? v.substring(0, 500) : v);
            }
        }
        reply(c, 200, "text/html; charset=utf-8", done());
        listener.onReceived(out.toString());
        return true;
    }

    private static void reply(Socket c, int code, String type, String body) throws Exception {
        byte[] b = body.getBytes(StandardCharsets.UTF_8);
        String status = code == 200 ? "OK" : code == 404 ? "Not Found" : "Error";
        String h = "HTTP/1.1 " + code + " " + status + "\r\nContent-Type: " + type
                + "\r\nContent-Length: " + b.length
                + "\r\nCache-Control: no-store\r\nReferrer-Policy: no-referrer\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n";
        OutputStream o = c.getOutputStream();
        o.write(h.getBytes(StandardCharsets.ISO_8859_1));
        o.write(b);
        o.flush();
    }

    private static String esc(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private static final String STYLE = "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            + "<style>body{font-family:system-ui,sans-serif;background:#0b1020;color:#eef2ff;margin:0;padding:24px;}"
            + "h1{font-size:24px;margin:0 0 6px}p{color:#aab4d4;margin:0 0 22px;line-height:1.4}"
            + "label{display:block;font-weight:600;margin:18px 0 8px}"
            + "input{box-sizing:border-box;width:100%;font-size:18px;padding:14px;border-radius:12px;border:1px solid #3a4470;background:#151c36;color:#fff}"
            + "button{margin-top:28px;width:100%;font-size:19px;font-weight:700;padding:16px;border:0;border-radius:14px;background:#7aa2ff;color:#0b1020}"
            + ".ok{font-size:22px;margin-top:40px}</style>";

    private String page() {
        StringBuilder f = new StringBuilder();
        JSONArray fields = form.optJSONArray("fields");
        if (fields != null) for (int i = 0; i < fields.length(); i++) {
            JSONObject o = fields.optJSONObject(i);
            if (o == null) continue;
            String id = esc(o.optString("id"));
            boolean secret = o.optBoolean("secret");
            f.append("<label for=\"").append(id).append("\">").append(esc(o.optString("label"))).append("</label>")
             .append("<input id=\"").append(id).append("\" name=\"").append(id).append("\" type=\"")
             .append(secret ? "password" : "text").append("\" autocomplete=\"off\" autocapitalize=\"off\" spellcheck=\"false\" maxlength=\"500\" value=\"")
             .append(esc(secret ? "" : o.optString("value"))).append("\">");
        }
        return "<!doctype html><html lang=\"fr\"><head><meta charset=\"utf-8\"><title>Accueil TV</title>" + STYLE + "</head><body>"
                + "<h1>" + esc(form.optString("title", "Saisie")) + "</h1>"
                + "<p>Colle ou tape le texte ici, puis envoie-le à la TV. Il est envoyé directement à la TV sur ton Wi-Fi.</p>"
                + "<form method=\"post\">" + f + "<button type=\"submit\">Envoyer à la TV</button></form></body></html>";
    }

    private static String done() {
        return "<!doctype html><html lang=\"fr\"><head><meta charset=\"utf-8\"><title>Accueil TV</title>" + STYLE + "</head><body>"
                + "<p class=\"ok\">C’est envoyé à la TV. Tu peux fermer cette page.</p></body></html>";
    }

    /** Adresse IPv4 de la TV sur le réseau local (Wi-Fi ou Ethernet). */
    private static String localIp() {
        try {
            String fallback = null;
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!ni.isUp() || ni.isLoopback()) continue;
                for (InetAddress a : Collections.list(ni.getInetAddresses())) {
                    if (!(a instanceof Inet4Address) || a.isLoopbackAddress()) continue;
                    if (a.isSiteLocalAddress()) return a.getHostAddress();
                    if (fallback == null) fallback = a.getHostAddress();
                }
            }
            return fallback;
        } catch (Exception e) {
            return null;
        }
    }
}
