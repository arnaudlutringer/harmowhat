package fr.loreille.volume;

import android.content.Context;
import android.media.AudioManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Volume « média » du téléphone (celui de la musique et des jeux) : l'appli prévient le joueur avant une partie
 * quand il est à zéro.
 */
@CapacitorPlugin(name = "Volume")
public class VolumePlugin extends Plugin {

    @PluginMethod
    public void getVolume(PluginCall call) {
        AudioManager audio = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        JSObject result = new JSObject();
        if (audio == null) {
            result.put("volume", 1.0);
            call.resolve(result);
            return;
        }
        int current = audio.getStreamVolume(AudioManager.STREAM_MUSIC);
        int max = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
        result.put("volume", max > 0 ? (double) current / max : 1.0);
        result.put("muted", current == 0);
        call.resolve(result);
    }
}