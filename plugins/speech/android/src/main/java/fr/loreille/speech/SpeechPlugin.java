package fr.loreille.speech;

import android.Manifest;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognitionService;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;
import java.util.List;

/**
 * Reconnaissance vocale en continu (jeu « Lecture continue ») : le module écoute, transmet le texte au fil de la
 * parole, et se relance de lui-même après chaque phrase ou chaque erreur, tant que l'appli ne l'arrête pas.
 * Chaque étape (prêt, début et fin de parole, niveau du micro, résultats, erreurs) est envoyée à l'appli dans
 * l'événement « speech », pour le test du micro.
 * Le service de reconnaissance de Google est préféré à celui du fabricant (Samsung…) quand il est installé.
 */
@CapacitorPlugin(
    name = "LoreilleSpeech",
    permissions = { @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "microphone") }
)
public class SpeechPlugin extends Plugin {

    private static final String GOOGLE_PACKAGE = "com.google.android.googlequicksearchbox";

    private final Handler main = new Handler(Looper.getMainLooper());
    private SpeechRecognizer recognizer;
    private boolean active = false;
    private String language = "fr-FR";
    private String service = "";
    private long lastLevel = 0;

    @PluginMethod
    public void available(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", SpeechRecognizer.isRecognitionAvailable(getContext()));
        result.put("services", servicesList());
        call.resolve(result);
    }

    @PluginMethod
    public void start(PluginCall call) {
        language = call.getString("language", "fr-FR");
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "afterPermission");
            return;
        }
        begin(call);
    }

    @PermissionCallback
    private void afterPermission(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) begin(call);
        else call.reject("Micro refusé");
    }

    private void begin(PluginCall call) {
        if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
            call.reject("Reconnaissance vocale indisponible sur ce téléphone");
            return;
        }
        main.post(() -> {
            active = true;
            create();
            listen();
            JSObject result = new JSObject();
            result.put("service", service);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        main.post(() -> {
            active = false;
            main.removeCallbacksAndMessages(null);
            destroy();
            call.resolve();
        });
    }

    @Override
    protected void handleOnDestroy() {
        active = false;
        main.removeCallbacksAndMessages(null);
        destroy();
    }

    /** Services de reconnaissance installés (« paquet/classe »). */
    private JSArray servicesList() {
        JSArray list = new JSArray();
        for (ResolveInfo info : services()) list.put(info.serviceInfo.packageName + "/" + info.serviceInfo.name);
        return list;
    }

    private List<ResolveInfo> services() {
        List<ResolveInfo> found = getContext().getPackageManager().queryIntentServices(new Intent(RecognitionService.SERVICE_INTERFACE), 0);
        return found != null ? found : new ArrayList<>();
    }

    private void create() {
        destroy();
        ComponentName google = null;
        for (ResolveInfo info : services()) {
            if (GOOGLE_PACKAGE.equals(info.serviceInfo.packageName)) google = new ComponentName(info.serviceInfo.packageName, info.serviceInfo.name);
        }
        recognizer = google != null
            ? SpeechRecognizer.createSpeechRecognizer(getContext(), google)
            : SpeechRecognizer.createSpeechRecognizer(getContext());
        service = google != null ? google.flattenToShortString() : "service par défaut";
        recognizer.setRecognitionListener(new Listener());
        emit("info", "service", service);
    }

    private void destroy() {
        if (recognizer == null) return;
        try {
            recognizer.cancel();
            recognizer.destroy();
        } catch (Exception ignored) {}
        recognizer = null;
    }

    private void listen() {
        if (!active || recognizer == null) return;
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, language);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language);
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        // Reconnaissance sur le téléphone quand le modèle français y est installé : plus rapide que par Internet.
        intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
        intent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getContext().getPackageName());
        try {
            recognizer.startListening(intent);
        } catch (Exception e) {
            emit("error", "message", String.valueOf(e.getMessage()));
            relaunch(500, true);
        }
    }

    /** Relance l'écoute après `delay` ms (en recréant le module de reconnaissance si `recreate`). */
    private void relaunch(long delay, boolean recreate) {
        if (!active) return;
        main.postDelayed(() -> {
            if (!active) return;
            if (recreate) create();
            listen();
        }, delay);
    }

    private void emit(String type, String key, Object value) {
        JSObject data = new JSObject();
        data.put("type", type);
        if (key != null) data.put(key, value);
        data.put("at", System.currentTimeMillis());
        notifyListeners("speech", data);
    }

    private void emitTexts(String type, Bundle bundle) {
        ArrayList<String> texts = bundle != null ? bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION) : null;
        JSArray list = new JSArray();
        if (texts != null) for (String t : texts) list.put(t);
        emit(type, "texts", list);
    }

    private static String errorName(int code) {
        switch (code) {
            case SpeechRecognizer.ERROR_AUDIO: return "audio";
            case SpeechRecognizer.ERROR_CLIENT: return "client";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "permission";
            case SpeechRecognizer.ERROR_NETWORK: return "réseau";
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "réseau (délai)";
            case SpeechRecognizer.ERROR_NO_MATCH: return "rien compris";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "occupé";
            case SpeechRecognizer.ERROR_SERVER: return "serveur";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "silence";
            default: return "erreur " + code;
        }
    }

    private class Listener implements RecognitionListener {

        @Override
        public void onReadyForSpeech(Bundle params) {
            emit("ready", null, null);
        }

        @Override
        public void onBeginningOfSpeech() {
            emit("begin", null, null);
        }

        @Override
        public void onRmsChanged(float rmsdB) {
            long now = System.currentTimeMillis();
            if (now - lastLevel < 100) return;
            lastLevel = now;
            emit("level", "db", rmsdB);
        }

        @Override
        public void onBufferReceived(byte[] buffer) {}

        @Override
        public void onEndOfSpeech() {
            emit("end", null, null);
        }

        @Override
        public void onError(int error) {
            JSObject data = new JSObject();
            data.put("type", "error");
            data.put("code", error);
            data.put("message", errorName(error));
            data.put("at", System.currentTimeMillis());
            notifyListeners("speech", data);
            if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) {
                active = false;
                return;
            }
            // Occupé ou erreur du module : on le recrée ; sinon (silence, rien compris), on réécoute aussitôt.
            boolean broken = error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY || error == SpeechRecognizer.ERROR_CLIENT;
            relaunch(broken ? 400 : 50, broken);
        }

        @Override
        public void onResults(Bundle results) {
            emitTexts("final", results);
            relaunch(50, false);
        }

        @Override
        public void onPartialResults(Bundle partialResults) {
            emitTexts("partial", partialResults);
        }

        @Override
        public void onEvent(int eventType, Bundle params) {}
    }
}
