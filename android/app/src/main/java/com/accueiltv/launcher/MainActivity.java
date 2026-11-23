package com.accueiltv.launcher;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Base64;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONArray;
import org.json.JSONObject;

import android.Manifest;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.json.JSONTokener;

/**
 * Lanceur Android TV : affiche l'interface web (dossier tv-launcher, copié dans l'appli)
 * en plein écran et lui donne accès aux applis installées via l'objet JavaScript « AndroidTV ».
 */
public class MainActivity extends Activity {

    // Adresse interne qui sert les fichiers de l'appli (assets/www) comme un vrai site https
    private static final String ASSET_HOST = "appassets.androidplatform.net";
    private static final String HOME_URL = "https://" + ASSET_HOST + "/assets/www/index.html";

    private WebView web;
    private WebViewAssetLoader assetLoader;
    private String installedCache = null;
    private ConnectivityManager.NetworkCallback netCallback = null;
    private static final int REQ_WIFI_NAME = 42;
    // Vrai pendant la saisie dans un champ : on ne touche pas au plein écran (cela refermerait le clavier)
    private volatile boolean typing = false;
    private PhoneInput phoneInput = null;
    private RemoteServer remote = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        hideSystemBars();

        assetLoader = new WebViewAssetLoader.Builder()
                .setDomain(ASSET_HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web = new WebView(this);
        web.setBackgroundColor(0xFF0A0E1A);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);          // réglages enregistrés (favoris, applis, météo…)
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        // Taille de page fixe : 1 pixel CSS = 1 dp de l'écran, aucun zoom automatique.
        // (La vue « large » + « vue d'ensemble » zoomait la page sur certaines TV : elle débordait.)
        // L'interface se met ensuite elle-même à l'échelle de l'écran (fonction fit() de app.js).
        s.setTextZoom(100);
        s.setUseWideViewPort(false);
        s.setLoadWithOverviewMode(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);

        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (ASSET_HOST.equals(uri.getHost())) return false; // l'interface elle-même
                openExternal(uri.toString());                     // tout le reste s'ouvre hors du lanceur
                return true;
            }
        });
        web.addJavascriptInterface(new Bridge(), "AndroidTV");
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        setContentView(web);
        web.requestFocus();
        web.loadUrl(HOME_URL);
        watchNetwork();
    }

    /** Prévient l'interface dès que la connexion change (Wi-Fi coupé, câble branché…). */
    private void watchNetwork() {
        if (Build.VERSION.SDK_INT < 24) return;
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            netCallback = new ConnectivityManager.NetworkCallback() {
                @Override public void onAvailable(Network n) { notifyNetwork(); }
                @Override public void onLost(Network n) { notifyNetwork(); }
                @Override public void onCapabilitiesChanged(Network n, NetworkCapabilities c) { notifyNetwork(); }
            };
            cm.registerDefaultNetworkCallback(netCallback);
        } catch (Exception ignored) { }
    }

    private void notifyNetwork() {
        runOnUiThread(() -> js("window.tvNetworkChanged && tvNetworkChanged()"));
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_WIFI_NAME) notifyNetwork();
    }

    /** État du réseau : connecté, Internet joignable, type, force du Wi-Fi (1 à 4), nom du réseau. */
    @SuppressWarnings("deprecation")
    private String networkJson() {
        JSONObject o = new JSONObject();
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            boolean connected = false, internet = false;
            String type = "none";
            if (Build.VERSION.SDK_INT >= 23) {
                Network n = cm.getActiveNetwork();
                NetworkCapabilities caps = n != null ? cm.getNetworkCapabilities(n) : null;
                if (caps != null) {
                    connected = true;
                    internet = caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
                    if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) type = "wifi";
                    else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) type = "ethernet";
                    else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) type = "cellular";
                    else type = "other";
                }
            } else {
                android.net.NetworkInfo ni = cm.getActiveNetworkInfo();
                if (ni != null && ni.isConnected()) {
                    connected = true; internet = true;
                    type = ni.getType() == ConnectivityManager.TYPE_WIFI ? "wifi"
                         : ni.getType() == ConnectivityManager.TYPE_ETHERNET ? "ethernet" : "other";
                }
            }
            o.put("connected", connected);
            o.put("internet", internet);
            o.put("type", type);
            if ("wifi".equals(type)) {
                WifiManager wm = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                WifiInfo wi = wm != null ? wm.getConnectionInfo() : null;
                if (wi != null) {
                    o.put("level", WifiManager.calculateSignalLevel(wi.getRssi(), 4) + 1);
                    String ssid = wi.getSSID();
                    if (ssid != null && !ssid.contains("unknown ssid")) o.put("ssid", ssid.replaceAll("^\"|\"$", ""));
                }
            }
        } catch (Exception ignored) { }
        return o.toString();
    }

    /** Télécharge l'APK de la nouvelle version puis lance l'installation (progression envoyée à la page). */
    private void downloadAndInstall(String url) {
        new Thread(() -> {
            try {
                File dir = new File(getCacheDir(), "updates");
                if (!dir.exists()) dir.mkdirs();
                File apk = new File(dir, "AccueilTV.apk");
                HttpURLConnection con = (HttpURLConnection) new URL(url).openConnection();
                con.setInstanceFollowRedirects(true);
                con.setConnectTimeout(15000);
                con.setReadTimeout(30000);
                int total = con.getContentLength();
                try (InputStream in = con.getInputStream(); FileOutputStream out = new FileOutputStream(apk)) {
                    byte[] buf = new byte[64 * 1024];
                    long done = 0; int last = -1, n;
                    while ((n = in.read(buf)) > 0) {
                        out.write(buf, 0, n); done += n;
                        int pct = total > 0 ? (int) (done * 100 / total) : 0;
                        if (pct != last && pct < 100) { last = pct; final int p = pct; runOnUiThread(() -> js("window.tvUpdateProgress && tvUpdateProgress(" + p + ")")); }
                    }
                }
                runOnUiThread(() -> installApk(apk));
            } catch (Exception e) {
                runOnUiThread(() -> js("window.tvUpdateProgress && tvUpdateProgress(-1)"));
            }
        }).start();
    }

    private void installApk(File apk) {
        if (Build.VERSION.SDK_INT >= 26 && !getPackageManager().canRequestPackageInstalls()) {
            // Android demande d'autoriser « Accueil TV » à installer des applis
            js("window.tvUpdateProgress && tvUpdateProgress(-2)");
            try {
                startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName()))
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            } catch (Exception ignored) { }
            return;
        }
        try {
            Uri uri = Build.VERSION.SDK_INT >= 24 ? UpdateProvider.uri(this) : Uri.fromFile(apk);
            Intent i = new Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            js("window.tvUpdateProgress && tvUpdateProgress(100)");
            startActivity(i);
        } catch (Exception e) {
            js("window.tvUpdateProgress && tvUpdateProgress(-1)");
        }
    }

    private void hideSystemBars() {
        if (typing) return;
        View decor = getWindow().getDecorView();
        decor.setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }

    private void js(String code) {
        if (web != null) web.evaluateJavascript(code, null);
    }

    /** Bouton Home pressé alors que le lanceur est déjà ouvert : retour en haut de l'accueil. */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        js("window.tvGoHome && tvGoHome()");
    }

    /** Un écran d'accueil ne se ferme jamais : Retour est confié à l'interface. */
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int code = event.getKeyCode();
        if (code == KeyEvent.KEYCODE_BACK || code == KeyEvent.KEYCODE_ESCAPE) {
            if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) {
                js("window.tvHandleKey && tvHandleKey('back')");
            }
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideSystemBars();
        installedCache = null; // une appli a pu être installée ou supprimée entre-temps
        if (web != null) {
            web.onResume();
            js("window.tvOnResume && tvOnResume()");
        }
    }

    /** Télécommande téléphone : active seulement quand l'appli est ouverte. */
    @Override
    protected void onStart() {
        super.onStart();
        remote().start();
    }

    @Override
    protected void onStop() {
        if (remote != null) remote.stop();
        super.onStop();
    }

    private synchronized RemoteServer remote() {
        if (remote == null) {
            remote = new RemoteServer(this, new RemoteServer.Host() {
                @Override public String call(String json) { return callJs(json); }
                @Override public void event(String kind) {
                    runOnUiThread(() -> js("window.tvRemoteEvent && tvRemoteEvent(" + JSONObject.quote(kind) + ")"));
                }
            });
        }
        return remote;
    }

    /** Appelle tvRemote(json) dans l'interface et attend sa réponse (au plus 4 s). */
    private String callJs(String json) {
        final String[] out = { null };
        final CountDownLatch done = new CountDownLatch(1);
        runOnUiThread(() -> {
            if (web == null) { done.countDown(); return; }
            web.evaluateJavascript("window.tvRemote ? tvRemote(" + JSONObject.quote(json) + ") : null", v -> {
                out[0] = v;
                done.countDown();
            });
        });
        try { done.await(4, TimeUnit.SECONDS); } catch (InterruptedException ignored) { }
        if (out[0] == null) return null;
        try {
            Object v = new JSONTokener(out[0]).nextValue(); // la réponse arrive sous forme de texte JSON
            return v instanceof String ? (String) v : null;
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    protected void onPause() {
        if (web != null) web.onPause();
        super.onPause();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    @Override
    protected void onDestroy() {
        if (netCallback != null && Build.VERSION.SDK_INT >= 24) {
            try { ((ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE)).unregisterNetworkCallback(netCallback); } catch (Exception ignored) { }
        }
        if (phoneInput != null) phoneInput.stop();
        if (remote != null) remote.stop();
        if (web != null) web.destroy();
        super.onDestroy();
    }

    /* ---------- Ouverture des applis et des liens ---------- */

    private Intent launchIntentFor(String pkg) {
        PackageManager pm = getPackageManager();
        Intent i = null;
        if (Build.VERSION.SDK_INT >= 21) i = pm.getLeanbackLaunchIntentForPackage(pkg);
        if (i == null) i = pm.getLaunchIntentForPackage(pkg);
        return i;
    }

    private void openExternal(String url) {
        try {
            Intent i;
            if (url.startsWith("intent:")) {
                i = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                try {
                    startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                } catch (ActivityNotFoundException e) {
                    String fallback = i.getStringExtra("browser_fallback_url");
                    if (fallback != null) openExternal(fallback);
                }
                return;
            }
            i = new Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (Exception e) {
            if (url.startsWith("market://")) {
                openExternal(url.replace("market://details", "https://play.google.com/store/apps/details"));
            } else {
                final String msg = "Aucune appli ne peut ouvrir ce lien sur cette TV.";
                js("window.tvToast && tvToast(" + JSONObject.quote(msg) + ")");
            }
        }
    }

    /* ---------- Liste des applis installées ---------- */

    private static String toDataUrl(Drawable d, int w, int h) {
        if (d == null) return "";
        try {
            Bitmap b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(b);
            d.setBounds(0, 0, w, h);
            d.draw(c);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            b.compress(Bitmap.CompressFormat.PNG, 100, out);
            b.recycle();
            return "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
        } catch (Exception e) {
            return "";
        }
    }

    /** Couleur moyenne de l'icône, pour le fond de la tuile. */
    private static String averageColor(Drawable d) {
        if (d == null) return "#2A3550";
        try {
            Bitmap b = Bitmap.createBitmap(24, 24, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(b);
            d.setBounds(0, 0, 24, 24);
            d.draw(c);
            long r = 0, g = 0, bl = 0, n = 0;
            for (int x = 0; x < 24; x++) {
                for (int y = 0; y < 24; y++) {
                    int p = b.getPixel(x, y);
                    if (((p >>> 24) & 0xFF) < 128) continue; // pixels transparents ignorés
                    r += (p >> 16) & 0xFF; g += (p >> 8) & 0xFF; bl += p & 0xFF; n++;
                }
            }
            b.recycle();
            if (n == 0) return "#2A3550";
            return String.format(Locale.ROOT, "#%02X%02X%02X", r / n, g / n, bl / n);
        } catch (Exception e) {
            return "#2A3550";
        }
    }

    private String buildInstalledList() {
        PackageManager pm = getPackageManager();
        List<ResolveInfo> all = new ArrayList<>();
        Set<String> leanback = new HashSet<>();
        if (Build.VERSION.SDK_INT >= 21) {
            List<ResolveInfo> tv = pm.queryIntentActivities(
                    new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER), 0);
            for (ResolveInfo ri : tv) leanback.add(ri.activityInfo.packageName);
            all.addAll(tv);
        }
        all.addAll(pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER), 0));

        List<JSONObject> apps = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (ResolveInfo ri : all) {
            String pkg = ri.activityInfo.packageName;
            if (pkg.equals(getPackageName()) || !seen.add(pkg)) continue;
            try {
                Drawable banner = null;
                if (Build.VERSION.SDK_INT >= 20) {
                    banner = ri.activityInfo.loadBanner(pm);
                    if (banner == null) banner = ri.activityInfo.applicationInfo.loadBanner(pm);
                }
                Drawable icon = ri.loadIcon(pm);
                JSONObject o = new JSONObject();
                o.put("package", pkg);
                o.put("name", String.valueOf(ri.loadLabel(pm)));
                o.put("banner", banner != null ? toDataUrl(banner, 480, 270) : "");
                o.put("icon", toDataUrl(icon, 192, 192));
                o.put("color", averageColor(icon));
                o.put("tv", leanback.contains(pkg));
                apps.add(o);
            } catch (Exception ignored) {
                // appli illisible : on la saute
            }
        }
        Collections.sort(apps, (a, b) -> a.optString("name").compareToIgnoreCase(b.optString("name")));
        JSONArray arr = new JSONArray();
        for (JSONObject o : apps) arr.put(o);
        return arr.toString();
    }

    /** Fonctions appelables depuis la page : window.AndroidTV.xxx(...) */
    private class Bridge {

        /** Ouvre la première appli installée parmi une liste de paquets séparés par des virgules. */
        @JavascriptInterface
        public boolean launchApp(String packages) {
            if (packages == null) return false;
            for (String p : packages.split(",")) {
                String pkg = p.trim();
                if (pkg.isEmpty()) continue;
                final Intent i = launchIntentFor(pkg);
                if (i != null) {
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
                    runOnUiThread(() -> {
                        try { startActivity(i); } catch (Exception ignored) { }
                    });
                    return true;
                }
            }
            return false;
        }

        /** Premier paquet installé de la liste, ou "" si aucun. */
        @JavascriptInterface
        public String installedPackage(String packages) {
            if (packages == null) return "";
            for (String p : packages.split(",")) {
                if (!p.trim().isEmpty() && launchIntentFor(p.trim()) != null) return p.trim();
            }
            return "";
        }

        /** Applis installées (nom, paquet, bannière TV, icône, couleur) au format JSON. */
        @JavascriptInterface
        public String getInstalledApps() {
            if (installedCache == null) installedCache = buildInstalledList();
            return installedCache;
        }

        @JavascriptInterface
        public void openUrl(String url) {
            runOnUiThread(() -> openExternal(url));
        }

        @JavascriptInterface
        public void openStore(String pkg) {
            runOnUiThread(() -> openExternal("market://details?id=" + pkg));
        }

        @JavascriptInterface
        public void openSystemSettings() {
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                } catch (Exception ignored) { }
            });
        }

        /** Affiche le clavier de la TV pour le champ de saisie sélectionné. */
        @JavascriptInterface
        public void showKeyboard() {
            typing = true;
            runOnUiThread(() -> {
                if (!web.hasFocus()) web.requestFocus();
                // petit délai : le champ doit avoir le focus avant que le clavier s'y attache
                web.postDelayed(() -> {
                    if (!typing) return;
                    InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
                    if (imm != null) imm.showSoftInput(web, 0);
                }, 120);
            });
        }

        /** Referme le clavier (saisie validée ou annulée). */
        @JavascriptInterface
        public void hideKeyboard() {
            typing = false;
            runOnUiThread(() -> {
                InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
                if (imm != null) imm.hideSoftInputFromWindow(web.getWindowToken(), 0);
                hideSystemBars();
            });
        }

        /** Saisie en cours : le plein écran immersif est mis en pause pour ne pas fermer le clavier. */
        @JavascriptInterface
        public void setTyping(boolean on) {
            typing = on;
            if (!on) runOnUiThread(MainActivity.this::hideSystemBars);
        }

        /** « Saisir depuis mon téléphone » : démarre la petite page locale et renvoie son adresse. */
        @JavascriptInterface
        public String startPhoneInput(String formJson) {
            if (phoneInput == null) {
                phoneInput = new PhoneInput(new PhoneInput.Listener() {
                    @Override public void onReceived(String json) {
                        runOnUiThread(() -> js("window.tvPhoneInput && tvPhoneInput(" + JSONObject.quote(json) + ")"));
                    }
                    @Override public void onEnded() {
                        runOnUiThread(() -> js("window.tvPhoneInputEnded && tvPhoneInputEnded()"));
                    }
                });
            }
            return phoneInput.start(formJson);
        }

        /** Télécommande téléphone : état (adresse, code, téléphones appairés). */
        @JavascriptInterface
        public String remoteInfo() { return remote().info(); }

        @JavascriptInterface
        public void remoteSetEnabled(boolean on) { remote().setEnabled(on); }

        @JavascriptInterface
        public String remoteNewCode() { return remote().newCode(); }

        @JavascriptInterface
        public void remoteForget() { remote().forgetPhones(); }

        @JavascriptInterface
        public void stopPhoneInput() {
            if (phoneInput != null) phoneInput.stop();
        }

        /** Taille réelle de l'écran et densité, pour le diagnostic (Paramètres → Écran). */
        @JavascriptInterface
        public String displayInfo() {
            try {
                android.util.DisplayMetrics m = getResources().getDisplayMetrics();
                JSONObject o = new JSONObject();
                o.put("widthPx", web.getWidth() > 0 ? web.getWidth() : m.widthPixels);
                o.put("heightPx", web.getHeight() > 0 ? web.getHeight() : m.heightPixels);
                o.put("density", m.density);
                o.put("dpi", m.densityDpi);
                return o.toString();
            } catch (Exception e) {
                return "{}";
            }
        }

        /** Réseau : {connected, internet, type, level, ssid} */
        @JavascriptInterface
        public String networkInfo() {
            return networkJson();
        }

        /** Demande l'autorisation de lire le nom du Wi-Fi (Android l'exige pour ce seul renseignement). */
        @JavascriptInterface
        public void requestWifiName() {
            if (Build.VERSION.SDK_INT >= 23) {
                runOnUiThread(() -> requestPermissions(new String[]{ Manifest.permission.ACCESS_FINE_LOCATION }, REQ_WIFI_NAME));
            }
        }

        /** Ouvre les réglages Wi-Fi / réseau de la TV. */
        @JavascriptInterface
        public void openNetworkSettings() {
            runOnUiThread(() -> {
                String[] actions = { Settings.ACTION_WIFI_SETTINGS, Settings.ACTION_WIRELESS_SETTINGS, Settings.ACTION_SETTINGS };
                for (String a : actions) {
                    try { startActivity(new Intent(a).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); return; } catch (Exception ignored) { }
                }
            });
        }

        /** Numéro de version (pour comparer avec la dernière version publiée). */
        @JavascriptInterface
        @SuppressWarnings("deprecation")
        public String versionCode() {
            try {
                android.content.pm.PackageInfo pi = getPackageManager().getPackageInfo(getPackageName(), 0);
                return String.valueOf(Build.VERSION.SDK_INT >= 28 ? pi.getLongVersionCode() : pi.versionCode);
            } catch (Exception e) {
                return "0";
            }
        }

        /**
         * Requête vers Voice Monkey (rangée Maison) : la clé part dans l'en-tête Authorization,
         * la réponse revient à la page par tvHttpResult(id, statut, corps).
         * Limité au serveur de Voice Monkey.
         */
        @JavascriptInterface
        public void httpGet(String id, String url, String bearer) {
            if (url == null || !url.startsWith("https://api-v3.voicemonkey.io/")) return;
            new Thread(() -> {
                int status = 0;
                String body = "";
                try {
                    HttpURLConnection con = (HttpURLConnection) new URL(url).openConnection();
                    con.setConnectTimeout(10000);
                    con.setReadTimeout(15000);
                    if (bearer != null && !bearer.trim().isEmpty()) con.setRequestProperty("Authorization", "Bearer " + bearer.trim());
                    status = con.getResponseCode();
                    InputStream in = status >= 400 ? con.getErrorStream() : con.getInputStream();
                    if (in != null) {
                        ByteArrayOutputStream out = new ByteArrayOutputStream();
                        byte[] buf = new byte[4096];
                        int n;
                        while ((n = in.read(buf)) > 0 && out.size() < 16384) out.write(buf, 0, n);
                        in.close();
                        body = out.toString("UTF-8");
                    }
                } catch (Exception e) {
                    status = 0;
                }
                final String call = "window.tvHttpResult && tvHttpResult(" + JSONObject.quote(id) + "," + status + "," + JSONObject.quote(body) + ")";
                runOnUiThread(() -> js(call));
            }).start();
        }

        /** Télécharge et installe la nouvelle version de l'appli. */
        @JavascriptInterface
        public void installUpdate(String url) {
            if (url == null || !url.startsWith("https://")) return;
            downloadAndInstall(url);
        }

        @JavascriptInterface
        public String version() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
            } catch (Exception e) {
                return "";
            }
        }
    }
}
