package com.bolatemre.khz;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Uygulamanın hesapladığı vakitleri araç takımlarının okuyacağı yere yazar, araç takımlarını yeniler ve ana ekrana eklemeyi ister. */
@CapacitorPlugin(name = "WidgetVeri")
public class WidgetVeriPlugin extends Plugin {
    @PluginMethod
    public void kaydet(PluginCall call) {
        String veri = call.getString("veri");
        if (veri == null) {
            call.reject("veri yok");
            return;
        }
        Context c = getContext();
        c.getSharedPreferences(WidgetYardimci.TERCIH, Context.MODE_PRIVATE).edit().putString("veri", veri).apply();
        WidgetYardimci.guncelleHepsi(c);
        call.resolve();
    }

    /** Ana ekranda kaç araç takımı var ve telefon tek dokunuşla eklemeyi destekliyor mu? */
    @PluginMethod
    public void durum(PluginCall call) {
        Context c = getContext();
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int n = m.getAppWidgetIds(new ComponentName(c, VakitWidget.class)).length
            + m.getAppWidgetIds(new ComponentName(c, VakitKucukWidget.class)).length;
        JSObject r = new JSObject();
        r.put("eklenen", n);
        r.put("sabitlenebilir", Build.VERSION.SDK_INT >= 26 && m.isRequestPinAppWidgetSupported());
        call.resolve(r);
    }

    /** Sistemin "ana ekrana ekle" penceresini açar (Android 8+). */
    @PluginMethod
    public void ekle(PluginCall call) {
        Context c = getContext();
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        Class<?> k = "kucuk".equals(call.getString("boyut", "buyuk")) ? VakitKucukWidget.class : VakitWidget.class;
        boolean istendi = false;
        if (Build.VERSION.SDK_INT >= 26 && m.isRequestPinAppWidgetSupported()) {
            istendi = m.requestPinAppWidget(new ComponentName(c, k), null, null);
        }
        JSObject r = new JSObject();
        r.put("istendi", istendi);
        call.resolve(r);
    }
}
