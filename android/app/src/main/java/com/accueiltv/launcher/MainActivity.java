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

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

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
    }

    private void hideSystemBars() {
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
            runOnUiThread(() -> {
                web.requestFocus();
                InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
                if (imm != null) imm.showSoftInput(web, InputMethodManager.SHOW_IMPLICIT);
            });
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
