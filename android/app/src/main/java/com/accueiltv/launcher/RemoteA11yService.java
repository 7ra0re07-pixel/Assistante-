package com.accueiltv.launcher;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.view.accessibility.AccessibilityEvent;

/**
 * Service d'accessibilité de la télécommande téléphone : il sert uniquement à appuyer sur
 * « Accueil » et « Retour » à la place de la télécommande, quand une autre appli est ouverte.
 * Il ne lit pas le contenu de l'écran.
 */
public class RemoteA11yService extends AccessibilityService {

    static volatile RemoteA11yService instance;

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }

    boolean back() { return performGlobalAction(GLOBAL_ACTION_BACK); }

    boolean home() { return performGlobalAction(GLOBAL_ACTION_HOME); }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) { /* rien à lire */ }

    @Override
    public void onInterrupt() { }

    @Override
    public boolean onUnbind(Intent intent) {
        instance = null;
        return super.onUnbind(intent);
    }

    @Override
    public void onDestroy() {
        instance = null;
        super.onDestroy();
    }
}
