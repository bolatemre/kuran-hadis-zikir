package com.bolatemre.khz;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.SystemClock;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/** Üç Nur araç takımları: uygulamanın bıraktığı vakitleri okur, görünümü günceller, sıradaki vakitte yeniden çizer. */
public final class WidgetYardimci {
    static final String TERCIH = "ucnur_widget";
    static final String YENILE = "com.bolatemre.khz.WIDGET_YENILE";
    static final String[] ADLAR = {"İmsak", "Güneş", "Öğle", "İkindi", "Akşam", "Yatsı"};
    static final int ALTIN = Color.parseColor("#E8C46E");
    static final int BEYAZ = Color.WHITE;
    static final int SOLUK = Color.parseColor("#CCDFE9E3");

    private static final int[] AD_ID = {R.id.w_ad0, R.id.w_ad1, R.id.w_ad2, R.id.w_ad3, R.id.w_ad4, R.id.w_ad5};
    private static final int[] SAAT_ID = {R.id.w_saat0, R.id.w_saat1, R.id.w_saat2, R.id.w_saat3, R.id.w_saat4, R.id.w_saat5};

    private WidgetYardimci() {}

    /** Gösterilecek gün ve sıradaki vakit. */
    static final class Durum {
        String konum;
        long[] gun;     // altı vakit (ms)
        int sonraki;    // vurgulanacak vakit
        long hedef;     // sıradaki vakit (ms)
    }

    static Durum durum(Context c, long simdi) {
        try {
            String s = c.getSharedPreferences(TERCIH, Context.MODE_PRIVATE).getString("veri", null);
            if (s == null) return null;
            JSONObject o = new JSONObject(s);
            JSONArray gunler = o.getJSONArray("gunler");
            List<long[]> liste = new ArrayList<>();
            for (int i = 0; i < gunler.length(); i++) {
                JSONArray v = gunler.getJSONObject(i).getJSONArray("v");
                if (v.length() != 6) continue;
                long[] g = new long[6];
                for (int j = 0; j < 6; j++) g[j] = v.getLong(j);
                liste.add(g);
            }
            for (long[] g : liste) {
                for (int j = 0; j < 6; j++) {
                    if (g[j] > simdi) {
                        Durum d = new Durum();
                        d.konum = o.optString("konum", "Üç Nur");
                        d.gun = g;
                        d.sonraki = j;
                        d.hedef = g[j];
                        return d;
                    }
                }
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }

    static String saat(long ms) {
        return new SimpleDateFormat("HH:mm", new Locale("tr", "TR")).format(new Date(ms));
    }

    static String tarih(long ms) {
        return new SimpleDateFormat("d MMMM EEEE", new Locale("tr", "TR")).format(new Date(ms));
    }

    static PendingIntent uygulamayiAc(Context c) {
        Intent i = new Intent(c, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(c, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void geriSayim(RemoteViews rv, int id, long hedef, long simdi) {
        long taban = SystemClock.elapsedRealtime() + Math.max(0, hedef - simdi);
        rv.setChronometer(id, taban, null, true);
        if (Build.VERSION.SDK_INT >= 24) rv.setChronometerCountDown(id, true);
    }

    static RemoteViews buyuk(Context c, Durum d, long simdi) {
        RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.widget_vakit);
        rv.setOnClickPendingIntent(R.id.w_kok, uygulamayiAc(c));
        if (d == null) {
            rv.setTextViewText(R.id.w_konum, "Üç Nur");
            rv.setTextViewText(R.id.w_tarih, "Vakitler için uygulamayı bir kez açın");
            rv.setTextViewText(R.id.w_etiket, "");
            rv.setChronometer(R.id.w_sayac, SystemClock.elapsedRealtime(), null, false);
            for (int i = 0; i < 6; i++) {
                rv.setTextViewText(AD_ID[i], ADLAR[i]);
                rv.setTextViewText(SAAT_ID[i], "--:--");
            }
            return rv;
        }
        rv.setTextViewText(R.id.w_konum, d.konum);
        rv.setTextViewText(R.id.w_tarih, tarih(d.gun[0]));
        rv.setTextViewText(R.id.w_etiket, ADLAR[d.sonraki] + " vaktine");
        geriSayim(rv, R.id.w_sayac, d.hedef, simdi);
        for (int i = 0; i < 6; i++) {
            int renk = i == d.sonraki ? ALTIN : BEYAZ;
            rv.setTextViewText(AD_ID[i], ADLAR[i]);
            rv.setTextViewText(SAAT_ID[i], saat(d.gun[i]));
            rv.setTextColor(AD_ID[i], i == d.sonraki ? ALTIN : SOLUK);
            rv.setTextColor(SAAT_ID[i], renk);
        }
        return rv;
    }

    static RemoteViews kucuk(Context c, Durum d, long simdi) {
        RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.widget_kucuk);
        rv.setOnClickPendingIntent(R.id.wk_kok, uygulamayiAc(c));
        if (d == null) {
            rv.setTextViewText(R.id.wk_konum, "Üç Nur");
            rv.setTextViewText(R.id.wk_etiket, "Uygulamayı açın");
            rv.setTextViewText(R.id.wk_saat, "");
            rv.setChronometer(R.id.wk_sayac, SystemClock.elapsedRealtime(), null, false);
            return rv;
        }
        rv.setTextViewText(R.id.wk_konum, d.konum);
        rv.setTextViewText(R.id.wk_etiket, ADLAR[d.sonraki] + " vaktine");
        rv.setTextViewText(R.id.wk_saat, saat(d.hedef));
        geriSayim(rv, R.id.wk_sayac, d.hedef, simdi);
        return rv;
    }

    /** Tüm araç takımlarını yeniden çizer ve sıradaki vakit girince tekrar çizilmek üzere alarm kurar. */
    static void guncelleHepsi(Context c) {
        long simdi = System.currentTimeMillis();
        Durum d = durum(c, simdi);
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] buyukler = m.getAppWidgetIds(new ComponentName(c, VakitWidget.class));
        int[] kucukler = m.getAppWidgetIds(new ComponentName(c, VakitKucukWidget.class));
        if (buyukler.length > 0) m.updateAppWidget(buyukler, buyuk(c, d, simdi));
        if (kucukler.length > 0) m.updateAppWidget(kucukler, kucuk(c, d, simdi));
        if (d != null && (buyukler.length > 0 || kucukler.length > 0)) alarmKur(c, d.hedef + 1000);
    }

    static void alarmKur(Context c, long zaman) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent i = new Intent(c, VakitWidget.class);
        i.setAction(YENILE);
        PendingIntent pi = PendingIntent.getBroadcast(c, 4242, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        try {
            if (Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms()) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, zaman, pi);
            } else {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, zaman, pi);
            }
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, zaman, pi);
        }
    }
}
