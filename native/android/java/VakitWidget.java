package com.bolatemre.khz;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;

/** Namaz vakitleri araç takımı (4x2): bugünün altı vakti ve sıradaki vakte geri sayım. */
public class VakitWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        WidgetYardimci.guncelleHepsi(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String a = intent.getAction();
        if (WidgetYardimci.YENILE.equals(a) || Intent.ACTION_TIME_CHANGED.equals(a) || Intent.ACTION_TIMEZONE_CHANGED.equals(a)) {
            WidgetYardimci.guncelleHepsi(context);
        }
    }
}
