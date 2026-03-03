# 🎯 RingLock

**Hassasiyet odaklı bir arcade mobil oyun. React Native & Expo ile geliştirildi.**

Küçülen halka hedefe kilitlendiği anda ekrana dokun. Öğrenmesi kolay, ustalaşması imkansız.

---

## 🎮 Nasıl Oynanır?

- Ekranda rastgele bir noktada **cyan renkli hedef halka** belirir
- **Pembe bir halka** ekranın kenarlarından hızla küçülerek hedefe doğru yaklaşır
- Halkalar **tam üst üste geldiği anda** ekrana dokun
- Her başarılı vuruşta yeni bir halka — her seferinde daha hızlı
- 3 canını kaybedersen **oyun biter**

### Vuruş Kalitesi
| Kalite | Hassasiyet | Geri Bildirim |
|--------|-----------|---------------|
| ⭐ **PERFECT** | ±5px | Güçlü titreşim + parlak flaş |
| ✅ **GOOD** | ±10px | Orta titreşim |
| ⚠️ **LATE** | ±18px | Hafif titreşim |
| ❌ **MISS** | Dışında | 1 can kaybedersin |

### Kombo Sistemi 🔥
- Ardışık vuruşlarla kombo sayacı yükselir
- **3x** → GOOD | **5x** → GREAT | **10x** → INSANE
- Her **15 kombo**'da ekstra bir can kazanırsın (maks 3)

### Görsel Evreler 🌈
Skor arttıkça arka plan dönüşür:
- **10+ puan** → Derin mavi atmosfer
- **25+ puan** → Mor neon geçişi
- **50+ puan** → Tam cyberpunk modu

---

## ⚙️ Ayarlar

Ana menüdeki **⚙ dişli çark** ikonuna dokunarak:
- **Ses** → Ses efektlerini aç/kapat
- **Titreşim** → Haptic geri bildirimi aç/kapat

Ayarlar cihazda kalıcı olarak saklanır.

---

## 🛠️ Teknoloji Altyapısı

| Teknoloji | Kullanım Amacı |
|-----------|---------------|
| **React Native** | Çapraz platform mobil framework |
| **Expo** (SDK 54) | Geliştirme ve build araçları |
| **Expo Router** | Dosya tabanlı navigasyon |
| **React Native Reanimated** | 60fps UI thread animasyonlar |
| **expo-av** | Yerel ses oynatma |
| **expo-haptics** | Dokunsal geri bildirim (titreşim) |
| **AsyncStorage** | Çevrimdışı skor kaydetme |

---

## 📁 Proje Yapısı

```
ringlock/
├── app/
│   ├── _layout.tsx          # Ana düzen, splash screen, provider'lar
│   ├── index.tsx             # Oyun ekranı + HUD bileşenleri
│   ├── +not-found.tsx        # 404 sayfası (temalı)
│   └── +native-intent.tsx    # Deep link yönlendirici
├── components/
│   ├── TargetRings.tsx       # Hedef + küçülen halka (scale tabanlı)
│   ├── MainMenu.tsx          # Ana menü ekranı
│   ├── GameOverOverlay.tsx   # Oyun sonu istatistik ekranı
│   ├── SettingsOverlay.tsx   # Ses & titreşim ayarları
│   ├── GridBackground.tsx    # Cyberpunk ızgara efekti
│   ├── ErrorBoundary.tsx     # Hata yakalama katmanı
│   └── ErrorFallback.tsx     # Hata geri dönüş arayüzü
├── hooks/
│   ├── useGameLoop.ts        # Oyun mantığı & durum makinesi
│   └── useGameLoop.test.ts   # Birim testleri
├── lib/
│   ├── sounds.ts             # Ses yöneticisi (expo-av)
│   └── SettingsContext.tsx    # Ayar sağlayıcısı (ses/titreşim)
├── constants/
│   └── game.ts               # Oyun sabitleri, renkler, tipler
└── assets/
    ├── icon.png              # Uygulama ikonu
    ├── splash.png            # Açılış ekranı
    └── sounds/
        ├── success.wav       # Başarılı vuruş sesi
        └── gameover.wav      # Oyun sonu sesi
```

---

## 🚀 Kurulum & Çalıştırma

### Gereksinimler
- Node.js 18+
- Telefonunda Expo Go uygulaması ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Adımlar

```bash
# Repoyu klonla
git clone https://github.com/fth530/ringlock.git
cd ringlock

# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npx expo start
```

Terminaldeki QR kodu Expo Go ile tarayarak telefonunda oyna.

### Production Build

```bash
# EAS CLI kur
npm install -g eas-cli

# Android APK oluştur
eas build --platform android

# iOS IPA oluştur
eas build --platform ios
```

---

## 🧪 Testler

```bash
npm test
```

Testler: başlatma, oyun durumu geçişleri, can sistemi, kombo sıfırlama ve menü navigasyonunu kapsar.

---

## 📱 Platform Desteği

| Platform | Durum |
|----------|-------|
| Android | ✅ Tam destek |
| iOS | ✅ Tam destek |
| Web | ⚠️ Temel destek (titreşim yok) |

---

## 📄 Lisans

MIT

---

<p align="center">
  ❤️ ile React Native kullanılarak geliştirildi
</p>
