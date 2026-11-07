package com.bolatemre.khz;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

/** Küçük araç takımı (2x1): sıradaki vakit ve geri sayım. */
public class VakitKucukWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        WidgetYardimci.guncelleHepsi(context);
    }
}
