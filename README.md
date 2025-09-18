# Amazon Ürün Aktarıcı Chrome Eklentisi

Amazon pazaryerlerinden ürün bilgilerini çekip CSV veya API ile kendi panelinize aktaran güçlü Chrome eklentisi.

## 🚀 Özellikler

### 📊 Ürün Verileri Çekme
- **Tam ürün bilgileri**: Başlık, fiyat, para birimi, stok durumu, satıcı, ASIN, kategori, açıklama
- **Görsel çekme**: Ürün resimlerinin URL'lerini toplar
- **Prime tespit**: Prime ürünlerini otomatik algılar
- **Çok dilli destek**: Tüm Amazon pazaryerlerinde çalışır

### 🌍 Global Pazaryeri Desteği
- 🇺🇸 ABD (.com)
- 🇹🇷 Türkiye (.com.tr)  
- 🇬🇧 Birleşik Krallık (.co.uk)
- 🇩🇪 Almanya (.de)
- 🇫🇷 Fransa (.fr)
- 🇮🇹 İtalya (.it)
- 🇪🇸 İspanya (.es)
- 🇨🇦 Kanada (.ca)
- 🇦🇪 BAE (.ae)
- 🇮🇳 Hindistan (.in)
- 🇦🇺 Avustralya (.com.au)
- 🇯🇵 Japonya (.co.jp)

### 🔍 Gelişmiş Filtreleme
- **Anahtar kelime** arama
- **Kategori** seçimi
- **Fiyat aralığı** (min-max)
- **Prime filtresi**: Sadece Prime veya Prime hariç
- **Sayfa/ürün sınırı** kontrolü

### ⚡ Hız ve Performans
- **Eşzamanlı işleme**: 1-8 tab arası paralel çekme
- **Adaptif rate limiting**: Akıllı bekleme süreleri
- **Batch işleme**: Sistemi zorlamadan toplu işlem
- **İlerleme takibi**: Canlı progress bar ve durum güncellemeleri

### 📤 Esnek Aktarım
- **CSV indirme**: Anında dosya indirimi
- **API entegrasyonu**: Kendi panelinize otomatik aktarım
- **Token desteği**: Bearer authentication

## 🛠️ Kurulum

### Chrome Web Mağazası'ndan (Yakında)
_Eklenti henüz Chrome Web Mağazası'nda yayınlanmamıştır._

### Manuel Kurulum (Developer Mode)

1. **Dosyaları indirin**
   ```bash
   git clone https://github.com/byiyuel/amazon-product-exporter.git
   cd amazon-product-exporter
   ```

2. **Chrome'da Developer Mode'u açın**
   - Chrome'da `chrome://extensions/` adresine gidin
   - Sağ üstten "Developer mode" seçeneğini açın

3. **Eklentiyi yükleyin**
   - "Load unpacked" butonuna tıklayın
   - `amazon-extension` klasörünü seçin
   - Eklenti toolbar'da görünecektir

## 📋 Kullanım Kılavuzu

### Temel Kullanım

1. **Eklenti ikonuna** tıklayarak popup'ı açın
2. **Pazaryeri** seçin (Türkiye, ABD, vs.)
3. **Anahtar kelime** girin (örn: "kablosuz mouse")
4. **Filtreleri** ayarlayın:
   - Kategori
   - Fiyat aralığı  
   - Prime filtresi
5. **Sınırları** belirleyin:
   - Sayfa sınırı (kaç sayfa taransın)
   - Ürün sınırı (maksimum ürün sayısı)
6. **Performans ayarları**:
   - Bekleme süresi (ms)
   - Eşzamanlı tab sayısı
7. **Dışa aktarım** seçin (CSV veya API)
8. **"Başlat"** butonuna tıklayın

### API Entegrasyonu

API ile kendi panelinize aktarmak için:

1. **Export** seçeneğini "API" yapın
2. **API URL** girin (örn: `https://panel.example.com/api/products`)
3. **API Token** girin (Bearer token)
4. Veriler JSON formatında POST edilecektir

#### API Payload Formatı
```json
[
  {
    "asin": "B08N5WRWNW",
    "title": "Logitech MX Master 3 Kablosuz Mouse",
    "price": "1299.00",
    "currency": "TRY",
    "inStock": true,
    "seller": "Amazon",
    "category": "Elektronik > Bilgisayar",
    "prime": true,
    "url": "https://www.amazon.com.tr/dp/B08N5WRWNW",
    "images": ["https://images-na.ssl-images-amazon.com/images/I/61mp5Z9PsyL._AC_SL1500_.jpg"],
    "description": "Gelişmiş scroll tekerleği • 4000 DPI sensör • USB-C şarj..."
  }
]
```

### CSV Formatı

CSV dosyası şu sütunları içerir:
- `asin` - Amazon ürün kodu
- `title` - Ürün başlığı  
- `price` - Fiyat
- `currency` - Para birimi
- `inStock` - Stok durumu (true/false)
- `seller` - Satıcı adı
- `category` - Kategori yolu
- `prime` - Prime durumu (true/false) 
- `url` - Ürün URL'si
- `imageUrls` - Resim URL'leri (boşlukla ayrılmış)
- `description` - Ürün açıklaması

## ⚙️ Gelişmiş Ayarlar

### Performans Optimizasyonu

**Hızlı tarama için:**
- Eşzamanlı tab: 4-6
- Bekleme: 500-800ms
- Sayfa sınırı: 3-5

**Güvenli tarama için:**
- Eşzamanlı tab: 2-3  
- Bekleme: 1000-1500ms
- Daha küçük batch'ler

### Rate Limit Önleme

Eklenti adaptif rate limiting kullanır:
- ✅ Başarılı isteklerde bekleme azalır
- ❌ Hata alırsanız bekleme artar
- 📊 Güncel bekleme süresi logta görünür

## 🐛 Sorun Giderme

### Yaygın Sorunlar

**"Permission denied" hatası**
- Manifest'te ilgili Amazon domaininin olduğundan emin olun
- Eklentiyi yeniden yükleyin

**Prime/Currency yanlış algılanıyor**
- Amazon'un sayfa yapısı değişmiş olabilir
- GitHub'da issue açın, düzeltelim

**Rate limit yiyorum**
- Bekleme süresini artırın
- Eşzamanlı tab sayısını azaltın
- Daha az sayfa ile deneyin

**Bazı ürünler çekilmiyor**
- Amazon bazen anti-bot koruması aktif eder
- Farklı saatte deneyin
- Daha yavaş ayarlar kullanın

## 🔧 Geliştirici Notları

### Kod Yapısı
```
amazon-extension/
├── manifest.json          # Extension tanımları
├── background.js          # Ana scraping logic
├── popup.html/js/css      # Kullanıcı arayüzü  
├── content/
│   ├── amazon_listing.js  # Liste sayfası scraper
│   └── amazon_product.js  # Ürün sayfası scraper
└── options.html           # Ayarlar sayfası
```

### Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik'`)
4. Branch'i push edin (`git push origin yeni-ozellik`)
5. Pull Request oluşturun

### Geliştirme Kurulumu

```bash
# Repo'yu klonlayın
git clone https://github.com/byiyuel/amazon-product-exporter.git
cd amazon-product-exporter

# Chrome'da developer mode ile yükleyin
# Değişiklik yaptıkça eklentiyi reload edin
```

## 📄 Lisans

Bu proje MIT lisansı altında yayınlanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## ⚠️ Yasal Uyarı

Bu eklenti sadece halka açık verilerle çalışır. Amazon'un [Terms of Service](https://www.amazon.com/gp/help/customer/display.html?nodeId=508088) kurallarına uygun şekilde kullanın. Ticari kullanım öncesi Amazon'dan izin alınmasını öneririz.

## 📞 Destek

- 🐛 **Bug Report**: [GitHub Issues](https://github.com/byiyuel/amazon-product-exporter/issues)
- 💡 **Feature Request**: [GitHub Discussions](https://github.com/byiyuel/amazon-product-exporter/discussions)
- 📧 **İletişim**: [baranyucel643@gmail.com](mailto:baranyucel643@gmail.com)

## 🏆 Katkıda Bulunanlar

- [@byiyuel](https://github.com/byiyuel) - Proje kurucusu

---

**⭐ Beğendiyseniz yıldız vermeyi unutmayın!**

*Son güncelleme: Eylül 2024*
