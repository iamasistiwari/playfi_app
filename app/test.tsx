import { View, StyleSheet, Button } from "react-native";
import { useAudioPlayer } from "expo-audio";

const audioSource =
  "https://rr1---sn-9fpnuxa-qxae.googlevideo.com/videoplayback?expire=1753718555&ei=u0qHaNXvMZuq9fwPw9T3sAE&ip=103.112.19.157&id=o-AFlvm-EviZ55p84BpqElXDeZGiF3t1QrTMABCCrani_x&itag=251&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&met=1753696955%2C&mh=nJ&mm=31%2C29&mn=sn-9fpnuxa-qxae%2Csn-qxaeenls&ms=au%2Crdu&mv=m&mvi=1&pl=24&rms=au%2Cau&initcwndbps=1671250&bui=AY1jyLNt8VNwy87YARRVJMPBVcz586F-sTyWpf82lFfzaXW9S7kZjfmiqk_MoAdO3xR9N3zZSQQhHEdF&vprv=1&svpuc=1&mime=audio%2Fwebm&ns=OZiCyHYuOyXV1WDbrwhJOxMQ&rqh=1&gir=yes&clen=3012786&dur=176.301&lmt=1714895131710204&mt=1753696392&fvip=2&keepalive=yes&lmw=1&fexp=51542235%2C51543008&c=TVHTML5&sefc=1&txp=4502434&n=J6Vj36APu09BOA&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cbui%2Cvprv%2Csvpuc%2Cmime%2Cns%2Crqh%2Cgir%2Cclen%2Cdur%2Clmt&sig=AJfQdSswRQIgX9N7v_C3idWaUdTwrJ1J6raUgKFSpTBo_sdpOZVf1NQCIQCrDG20wiAZlxo3mGvKLoj7gNdV5UaKelbcva_tgps8MA%3D%3D&lsparams=met%2Cmh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Crms%2Cinitcwndbps&lsig=APaTxxMwRAIgKbWmUR2ntn2--unRRlvD8b05i3rEVop1JutbYTXFTNsCIBPxAtc1a02w0cRKaRp6nB7FOHpbuipu-8dGNBNRPGlM";

export default function HomeScreen() {
  const player = useAudioPlayer(audioSource);

  return (
    <View className="bg-primary min-h-[100vh]">
      <Button title="Play Sound" onPress={() => player.play()} />
      <Button
        title="Replay Sound"
        onPress={() => {
          player.seekTo(0);
          player.play();
        }}
      />
    </View>
  );
}
