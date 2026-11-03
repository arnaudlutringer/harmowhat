import AVFoundation
import Capacitor

/// Volume « média » du téléphone : l'appli prévient le joueur avant une partie quand il est à zéro.
/// (iOS ne dit pas si l'interrupteur silencieux est activé : l'appli joue le son malgré lui, voir audio/engine.ts.)
@objc(VolumePlugin)
public class VolumePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "VolumePlugin"
    public let jsName = "Volume"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getVolume", returnType: CAPPluginReturnPromise)
    ]

    @objc func getVolume(_ call: CAPPluginCall) {
        let volume = AVAudioSession.sharedInstance().outputVolume
        call.resolve(["volume": Double(volume), "muted": volume == 0])
    }
}