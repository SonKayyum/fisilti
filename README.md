# Fısıltı - Konum Tabanlı Sosyal Medya Uygulaması

Fısıltı, kullanıcıların yakınlarındaki insanların düşüncelerini görebileceği ve kendi fikirlerini paylaşabileceği konum tabanlı bir sosyal medya uygulamasıdır.

## Özellikler

- 🌍 **Konum Tabanlı İçerik**: Kullanıcıların konumuna göre yakındaki fısıltıları görme
- 👤 **Anonim Kullanım**: Guest kullanıcı olarak anonim şekilde katılım
- 💬 **Yorum Sistemi**: Fısıltılara yorum yapabilme
- 📱 **Responsive Tasarım**: Mobil ve desktop uyumlu arayüz
- 🎨 **Modern UI**: Tailwind CSS ile güzel ve kullanıcı dostu tasarım

## Teknolojiler

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Veritabanı**: PostgreSQL + Prisma ORM
- **Kimlik Doğrulama**: NextAuth.js
- **İkonlar**: Lucide React

## Kurulum

1. Projeyi klonlayın:
```bash
git clone <repository-url>
cd fisilti
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Environment dosyasını oluşturun:
```bash
cp .env.example .env.local
```

4. `.env.local` dosyasını düzenleyin ve veritabanı bağlantı bilgilerini girin:
```
DATABASE_URL="postgresql://username:password@localhost:5432/fisilti"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

5. Veritabanını oluşturun ve migrate edin:
```bash
npx prisma migrate dev
npx prisma generate
```

6. Development server'ı başlatın:
```bash
npm run dev
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

## Veritabanı Şeması

### User
- Kullanıcı bilgileri (guest ve normal kullanıcılar)
- Anonim kullanım için isGuest flag'i

### Thought
- Fısıltı içeriği
- Konum bilgisi (latitude, longitude)
- Yazar bilgisi

### Comment
- Fısıltılara yapılan yorumlar
- Yazar ve fısıltı ilişkisi

## API Endpoints

### Thoughts
- `GET /api/thoughts` - Konum bazlı fısıltıları getir
- `POST /api/thoughts` - Yeni fısıltı oluştur

### Comments
- `GET /api/thoughts/[id]/comments` - Fısıltı yorumlarını getir
- `POST /api/thoughts/[id]/comments` - Yeni yorum oluştur

### Users
- `POST /api/users/guest` - Guest kullanıcı oluştur

## Deployment

Vercel ile deployment için:

1. Vercel hesabınızda yeni proje oluşturun
2. GitHub repository'nizi bağlayın
3. Environment variables'ları ekleyin
4. PostgreSQL veritabanı kurun (Vercel Postgres, Supabase, vb.)
5. Deploy edin

## Gelecek Özellikler

- [ ] Gerçek zamanlı bildirimler
- [ ] iOS uygulaması
- [ ] Gelişmiş konum filtreleme
- [ ] Kullanıcı profilleri
- [ ] Beğeni sistemi
- [ ] Hashtag desteği

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.