package com.accueiltv.launcher;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;

import org.json.JSONObject;

/**
 * Télécommande téléphone : service au premier plan (avec notification) qui garde le serveur
 * actif même quand une autre appli (Netflix, YouTube…) est ouverte sur la TV.
 *
 * Aiguillage des commandes :
 * - Accueil : rouvre Accueil TV (par le service d'accessibilité, sinon directement) ;
 * - Retour hors d'Accueil TV : GLOBAL_ACTION_BACK du service d'accessibilité ;
 * - le reste : transmis à l'interface (JavaScript) d'Accueil TV.
 */
public class RemoteService extends Service {

    private static final String CHANNEL = "telecommande";
    private static final int NOTIF_ID = 8080;

    private static RemoteServer server;
    private static String lastState = null; // dernier état connu de l'interface (si elle ne répond pas)

    /** Serveur unique de l'appli (créé à la demande). */
    static synchronized RemoteServer server(Context ctx) {
        if (server == null) {
            final Context app = ctx.getApplicationContext();
            server = new RemoteServer(app, new RemoteServer.Host() {
                @Override public String call(String json) { return dispatch(app, json); }
                @Override public void event(String kind) {
                    MainActivity a = MainActivity.current;
                    if (a != null) a.runOnUiThread(() -> a.js("window.tvRemoteEvent && tvRemoteEvent(" + JSONObject.quote(kind) + ")"));
                }
            });
        }
        return server;
    }

    /** Démarre (ou arrête) le service selon le réglage. À appeler depuis l'appli au premier plan. */
    static void sync(Context ctx) {
        Intent i = new Intent(ctx, RemoteService.class);
        if (server(ctx).enabled()) {
            try {
                if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i); else ctx.startService(i);
            } catch (Exception e) {
                server(ctx).start(); // service refusé par le système : au moins tant que l'appli est ouverte
            }
        } else {
            ctx.stopService(i);
            server(ctx).stop();
        }
    }

    /** Le service d'accessibilité « Accueil TV » est-il activé dans les réglages de la TV ? */
    static boolean a11yEnabled(Context ctx) {
        if (RemoteA11yService.instance != null) return true;
        try {
            String list = Settings.Secure.getString(ctx.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
            if (list == null) return false;
            ComponentName me = new ComponentName(ctx, RemoteA11yService.class);
            for (String s : list.split(":")) {
                ComponentName c = ComponentName.unflattenFromString(s);
                if (me.equals(c)) return true;
            }
        } catch (Exception ignored) { }
        return false;
    }

    private static final String NEED_A11Y = "Active le service d’accessibilité « Accueil TV » sur la TV (Paramètres › Télécommande) pour que Accueil et Retour marchent dans toutes les applis.";

    /** Traite une commande du téléphone et renvoie la réponse JSON. */
    static String dispatch(Context ctx, String json) {
        JSONObject cmd;
        try { cmd = new JSONObject(json); } catch (Exception e) { return "{\"ok\":false}"; }
        String type = cmd.optString("type"), key = cmd.optString("key");
        boolean fg = MainActivity.visible;
        RemoteA11yService a11y = RemoteA11yService.instance;
        JSONObject res;
        try {
            if (type.equals("key") && key.equals("home") && !fg) {
                res = goHome(ctx, a11y);
            } else if (type.equals("key") && key.equals("back") && !fg) {
                if (a11y != null && a11y.back()) res = new JSONObject().put("ok", true);
                else res = new JSONObject().put("ok", false).put("error", NEED_A11Y);
            } else if (type.equals("key") && !fg) {
                res = new JSONObject().put("ok", false)
                        .put("error", "Une autre appli est ouverte sur la TV : les flèches et OK du téléphone pilotent seulement Accueil TV. Utilise Accueil pour y revenir.");
            } else {
                String r = callUi(json);
                res = r != null ? new JSONObject(r) : null;
                if (res == null) {
                    res = new JSONObject().put("ok", !type.equals("state") ? false : true);
                    if (!type.equals("state")) res.put("error", "Accueil TV ne répond pas pour l’instant. Appuie sur Accueil pour le rouvrir.");
                }
                if (type.equals("state") && res.has("apps")) lastState = res.toString();
            }
            // état joint à chaque réponse : le téléphone sait si l'accessibilité est active et ce qui est ouvert
            JSONObject state = type.equals("state") ? res : res.optJSONObject("state");
            if (state == null || !state.has("apps")) {
                state = lastState != null ? new JSONObject(lastState) : new JSONObject("{\"ok\":true,\"field\":null,\"apps\":[],\"home\":{\"ready\":false,\"key\":false,\"devices\":[]}}");
                if (type.equals("state")) { state.put("ok", true); res = state; } else res.put("state", state);
            }
            JSONObject tv = new JSONObject().put("foreground", fg).put("a11y", a11yEnabled(ctx));
            state.put("tv", tv);
            if (!fg) state.put("field", JSONObject.NULL);
            return res.toString();
        } catch (Exception e) {
            return "{\"ok\":false,\"error\":\"Commande impossible.\"}";
        }
    }

    private static String callUi(String json) {
        MainActivity a = MainActivity.current;
        return a == null ? null : a.callJs(json);
    }

    /** Accueil depuis une autre appli : rouvre Accueil TV. */
    private static JSONObject goHome(Context ctx, RemoteA11yService a11y) throws Exception {
        Intent i = new Intent(ctx, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        if (a11y != null) {
            a11y.home(); // bouton Home d'Android (Accueil TV s'il est l'écran d'accueil)
            try { a11y.startActivity(i); } catch (Exception ignored) { } // et Accueil TV dans tous les cas
            return new JSONObject().put("ok", true);
        }
        try { ctx.startActivity(i); } catch (Exception ignored) { }
        // Android 10 et plus bloque l'ouverture depuis l'arrière-plan sans le service d'accessibilité
        if (Build.VERSION.SDK_INT >= 29) return new JSONObject().put("ok", false).put("error", NEED_A11Y);
        return new JSONObject().put("ok", true);
    }

    /* ---------- Service ---------- */

    @Override
    public void onCreate() {
        super.onCreate();
        Notification n = notification();
        try {
            if (Build.VERSION.SDK_INT >= 34) startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            else startForeground(NOTIF_ID, n);
        } catch (Exception e) {
            // le système refuse le premier plan : le serveur tourne tant que l'appli est ouverte
        }
        server(this).start();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (!server(this).enabled()) { stopSelf(); return START_NOT_STICKY; }
        server(this).start();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        server(this).stop();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    private Notification notification() {
        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm != null && nm.getNotificationChannel(CHANNEL) == null) {
                NotificationChannel ch = new NotificationChannel(CHANNEL, "Télécommande téléphone", NotificationManager.IMPORTANCE_LOW);
                ch.setDescription("Garde la télécommande téléphone active quand une autre appli est ouverte");
                ch.setShowBadge(false);
                nm.createNotificationChannel(ch);
            }
            b = new Notification.Builder(this, CHANNEL);
        } else {
            b = new Notification.Builder(this).setPriority(Notification.PRIORITY_LOW);
        }
        int piFlags = Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0;
        PendingIntent open = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), piFlags);
        return b.setSmallIcon(R.drawable.ic_notif_remote)
                .setContentTitle("Télécommande téléphone active")
                .setContentText("Accueil TV reste joignable depuis ton téléphone")
                .setContentIntent(open)
                .setOngoing(true)
                .build();
    }
}
