package com.accueiltv.launcher;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Télécommande téléphone : petit serveur web sur le Wi-Fi de la maison (port 8080),
 * actif seulement quand l'appli est ouverte.
 *
 * Sécurité :
 * - seules les adresses du réseau local sont acceptées ;
 * - un téléphone doit d'abord saisir le code à 4 chiffres affiché sur la TV ; il reçoit alors
 *   un jeton secret (enregistré sur la TV) à joindre à chaque commande ;
 * - trop d'essais de code faux : blocage temporaire, puis nouveau code ;
 * - l'adresse doit être une IP (protection contre le « DNS rebinding ») et aucune autre page web
 *   ne peut envoyer de commande à la place de la télécommande (pas de CORS, en-tête obligatoire).
 */
class RemoteServer {

    interface Host {
        /** Exécute une commande dans l'interface (JavaScript) et renvoie sa réponse JSON. */
        String call(String json);
        /** Événement pour l'interface : « paired », « code ». */
        void event(String kind);
    }

    static final int[] PORTS = { 8080, 8081, 8082, 8090 };
    private static final int MAX_BODY = 8 * 1024;
    private static final String PREFS = "remote";

    private final Context ctx;
    private final Host host;
    private final SecureRandom rnd = new SecureRandom();
    private final SharedPreferences prefs;

    private ServerSocket server;
    private volatile boolean running;
    private String code;
    private int failures = 0, failuresTotal = 0;
    private long lockedUntil = 0;

    RemoteServer(Context ctx, Host host) {
        this.ctx = ctx.getApplicationContext();
        this.host = host;
        this.prefs = this.ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        newCode();
    }

    boolean enabled() { return prefs.getBoolean("enabled", true); }

    void setEnabled(boolean on) {
        prefs.edit().putBoolean("enabled", on).apply();
        if (on) start(); else stop();
    }

    synchronized String newCode() {
        code = String.format(Locale.ROOT, "%04d", rnd.nextInt(10000));
        failures = 0; failuresTotal = 0; lockedUntil = 0;
        return code;
    }

    synchronized void forgetPhones() {
        prefs.edit().putStringSet("tokens", new HashSet<>()).apply();
    }

    private Set<String> tokens() {
        return new HashSet<>(prefs.getStringSet("tokens", new HashSet<>()));
    }

    synchronized void start() {
        if (running || !enabled()) return;
        for (int port : PORTS) {
            try {
                server = new ServerSocket(port);
                break;
            } catch (Exception e) {
                server = null;
            }
        }
        if (server == null) return;
        running = true;
        final ServerSocket s = server;
        Thread t = new Thread(() -> loop(s), "telecommande");
        t.setDaemon(true);
        t.start();
    }

    synchronized void stop() {
        running = false;
        if (server != null) { try { server.close(); } catch (Exception ignored) { } }
        server = null;
    }

    /** État pour la page Paramètres. */
    synchronized String info() {
        JSONObject o = new JSONObject();
        try {
            o.put("enabled", enabled());
            o.put("running", running && server != null);
            o.put("code", code);
            o.put("paired", tokens().size());
            String ip = localIp();
            if (running && server != null && ip != null) o.put("url", "http://" + ip + (server.getLocalPort() == 80 ? "" : ":" + server.getLocalPort()));
        } catch (Exception ignored) { }
        return o.toString();
    }

    private void loop(ServerSocket s) {
        while (running && !s.isClosed()) {
            try {
                final Socket c = s.accept();
                Thread t = new Thread(() -> {
                    try (Socket sock = c) {
                        sock.setSoTimeout(8000);
                        handle(sock);
                    } catch (Exception ignored) { }
                }, "telecommande-requete");
                t.setDaemon(true);
                t.start();
            } catch (Exception e) {
                if (s.isClosed()) break;
            }
        }
    }

    private static boolean isLocal(InetAddress a) {
        if (a == null) return false;
        if (a.isLoopbackAddress() || a.isSiteLocalAddress() || a.isLinkLocalAddress()) return true;
        if (a instanceof Inet6Address) { // adresses locales uniques fc00::/7
            byte b = a.getAddress()[0];
            return (b & 0xFE) == 0xFC;
        }
        return false;
    }

    private void handle(Socket c) throws Exception {
        if (!isLocal(c.getInetAddress())) { reply(c, 403, "text/plain; charset=utf-8", "Réservé au réseau local."); return; }

        InputStream in = c.getInputStream();
        ByteArrayOutputStream head = new ByteArrayOutputStream();
        int last4 = 0, b;
        while ((b = in.read()) != -1) {
            head.write(b);
            last4 = (last4 << 8) | b;
            if (last4 == 0x0D0A0D0A) break;
            if (head.size() > 8192) { reply(c, 431, "text/plain", "Trop long"); return; }
        }
        String[] lines = head.toString("ISO-8859-1").split("\r\n");
        String[] req = lines[0].split(" ");
        if (req.length < 2) return;
        String method = req[0], path = req[1];
        int q = path.indexOf('?');
        if (q >= 0) path = path.substring(0, q);

        String hostHeader = "", origin = null, token = "";
        int len = 0;
        for (String l : lines) {
            int i = l.indexOf(':');
            if (i <= 0) continue;
            String k = l.substring(0, i).trim().toLowerCase(Locale.ROOT), v = l.substring(i + 1).trim();
            if (k.equals("host")) hostHeader = v;
            else if (k.equals("origin")) origin = v;
            else if (k.equals("x-token")) token = v;
            else if (k.equals("content-length")) { try { len = Integer.parseInt(v); } catch (Exception ignored) { } }
        }
        // L'adresse doit être une IP : une page web extérieure ne peut pas se faire passer pour la TV
        String hostOnly = hostHeader.replaceAll(":\\d+$", "").replace("[", "").replace("]", "");
        if (!hostOnly.matches("[0-9.]+|[0-9a-fA-F:]+|localhost")) { reply(c, 403, "text/plain; charset=utf-8", "Adresse non autorisée."); return; }
        if (origin != null && !origin.equals("http://" + hostHeader)) { reply(c, 403, "text/plain; charset=utf-8", "Origine non autorisée."); return; }

        if (method.equals("GET") && (path.equals("/") || path.equals("/index.html"))) {
            asset(c, "www/remote/index.html", "text/html; charset=utf-8");
            return;
        }
        if (method.equals("GET") && path.matches("/logos/[a-z0-9_.-]+\\.(svg|png)")) {
            asset(c, "www" + path, path.endsWith(".svg") ? "image/svg+xml" : "image/png");
            return;
        }

        if (!path.startsWith("/api/")) { reply(c, 404, "text/plain; charset=utf-8", "Introuvable."); return; }

        String body = "";
        if (method.equals("POST")) {
            if (len < 0 || len > MAX_BODY) { reply(c, 413, "application/json", "{\"ok\":false,\"error\":\"Trop long\"}"); return; }
            byte[] buf = new byte[len];
            int off = 0;
            while (off < len) { int n = in.read(buf, off, len - off); if (n < 0) break; off += n; }
            body = new String(buf, 0, off, StandardCharsets.UTF_8);
        }

        if (path.equals("/api/pair") && method.equals("POST")) { pair(c, body); return; }

        if (token.isEmpty() || !tokens().contains(token)) {
            reply(c, 401, "application/json", "{\"ok\":false,\"error\":\"Téléphone non appairé\"}");
            return;
        }
        if (path.equals("/api/state") && method.equals("GET")) {
            reply(c, 200, "application/json; charset=utf-8", answer(host.call("{\"type\":\"state\"}")));
            return;
        }
        if (path.equals("/api/cmd") && method.equals("POST")) {
            JSONObject cmd;
            try { cmd = new JSONObject(body); } catch (Exception e) { reply(c, 400, "application/json", "{\"ok\":false}"); return; }
            String type = cmd.optString("type");
            if (!type.matches("key|app|home|text")) { reply(c, 400, "application/json", "{\"ok\":false}"); return; }
            reply(c, 200, "application/json; charset=utf-8", answer(host.call(cmd.toString())));
            return;
        }
        reply(c, 404, "application/json", "{\"ok\":false}");
    }

    private static String answer(String s) {
        return s == null ? "{\"ok\":false,\"error\":\"La TV ne répond pas.\"}" : s;
    }

    private void pair(Socket c, String body) throws Exception {
        String given = "";
        try { given = new JSONObject(body).optString("code"); } catch (Exception ignored) { }
        String token = null, error = null;
        boolean changed = false;
        synchronized (this) {
            long now = System.currentTimeMillis();
            if (now < lockedUntil) {
                error = "Trop d’essais. Réessaie dans " + ((lockedUntil - now) / 1000 + 1) + " s.";
            } else if (given.equals(code)) {
                byte[] r = new byte[24];
                rnd.nextBytes(r);
                StringBuilder sb = new StringBuilder();
                for (byte x : r) sb.append(String.format(Locale.ROOT, "%02x", x));
                token = sb.toString();
                Set<String> t = tokens();
                t.add(token);
                prefs.edit().putStringSet("tokens", t).apply();
                failures = 0;
            } else {
                failures++; failuresTotal++;
                error = "Code incorrect.";
                if (failures >= 5) { lockedUntil = now + 30000; failures = 0; error = "Trop d’essais. Réessaie dans 30 s."; }
                if (failuresTotal >= 20) { newCode(); changed = true; error = "Trop d’essais : un nouveau code est affiché sur la TV."; }
            }
        }
        if (changed) host.event("code");
        JSONObject o = new JSONObject();
        if (token != null) {
            o.put("ok", true);
            o.put("token", token);
            reply(c, 200, "application/json; charset=utf-8", o.toString());
            host.event("paired");
        } else {
            o.put("ok", false);
            o.put("error", error);
            reply(c, 403, "application/json; charset=utf-8", o.toString());
        }
    }

    private void asset(Socket c, String name, String type) throws Exception {
        try (InputStream is = ctx.getAssets().open(name)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = is.read(buf)) > 0) out.write(buf, 0, n);
            replyBytes(c, 200, type, out.toByteArray());
        } catch (java.io.FileNotFoundException e) {
            reply(c, 404, "text/plain; charset=utf-8", "Introuvable.");
        }
    }

    private static void reply(Socket c, int code, String type, String body) throws Exception {
        replyBytes(c, code, type, body.getBytes(StandardCharsets.UTF_8));
    }

    private static void replyBytes(Socket c, int code, String type, byte[] b) throws Exception {
        String status = code == 200 ? "OK" : code == 401 ? "Unauthorized" : code == 403 ? "Forbidden" : code == 404 ? "Not Found" : "Error";
        String h = "HTTP/1.1 " + code + " " + status + "\r\nContent-Type: " + type
                + "\r\nContent-Length: " + b.length
                + "\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nX-Frame-Options: DENY"
                + "\r\nReferrer-Policy: no-referrer\r\nConnection: close\r\n\r\n";
        OutputStream o = c.getOutputStream();
        o.write(h.getBytes(StandardCharsets.ISO_8859_1));
        o.write(b);
        o.flush();
    }

    /** Adresse IPv4 de la TV sur le réseau local (Wi-Fi ou Ethernet). */
    static String localIp() {
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
