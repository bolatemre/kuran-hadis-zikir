package com.bolatemre.khz;

import android.content.Context;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Uygulamanın hesapladığı vakitleri araç takımlarının okuyacağı yere yazar ve araç takımlarını yeniler. */
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
}
