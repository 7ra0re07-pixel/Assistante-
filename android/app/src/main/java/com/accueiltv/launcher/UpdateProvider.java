package com.accueiltv.launcher;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;

/**
 * Donne à l'installateur d'Android un accès en lecture au fichier de mise à jour téléchargé
 * (cache/updates/AccueilTV.apk), et à rien d'autre.
 */
public class UpdateProvider extends ContentProvider {

    static Uri uri(Context ctx) {
        return Uri.parse("content://" + ctx.getPackageName() + ".updates/AccueilTV.apk");
    }

    private File apk() {
        return new File(new File(getContext().getCacheDir(), "updates"), "AccueilTV.apk");
    }

    @Override public boolean onCreate() { return true; }

    @Override public String getType(Uri uri) { return "application/vnd.android.package-archive"; }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        if (!"AccueilTV.apk".equals(uri.getLastPathSegment())) throw new FileNotFoundException();
        return ParcelFileDescriptor.open(apk(), ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] args, String sort) {
        File f = apk();
        MatrixCursor c = new MatrixCursor(new String[]{ OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE });
        c.addRow(new Object[]{ f.getName(), f.length() });
        return c;
    }

    @Override public Uri insert(Uri uri, ContentValues values) { return null; }
    @Override public int delete(Uri uri, String selection, String[] args) { return 0; }
    @Override public int update(Uri uri, ContentValues values, String selection, String[] args) { return 0; }
}
