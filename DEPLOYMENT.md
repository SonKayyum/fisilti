# Deployment Rehberi

## Vercel ile Deployment

### 1. Vercel Hesabı ve Proje Oluşturma

1. [Vercel](https://vercel.com) hesabınıza giriş yapın
2. "New Project" butonuna tıklayın
3. GitHub repository'nizi import edin
4. Proje ayarlarını yapılandırın

### 2. Environment Variables

Vercel dashboard'da aşağıdaki environment variables'ları ekleyin:

```
DATABASE_URL=postgresql://username:password@host:port/database
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
```

### 3. Veritabanı Kurulumu

#### Seçenek 1: Vercel Postgres
1. Vercel dashboard'da "Storage" sekmesine gidin
2. "Create Database" → "Postgres" seçin
3. Database'i oluşturun
4. Connection string'i kopyalayın ve `DATABASE_URL` olarak ekleyin

#### Seçenek 2: Supabase
1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni proje oluşturun
3. Settings → Database → Connection string'i kopyalayın
4. `DATABASE_URL` olarak ekleyin

#### Seçenek 3: PlanetScale
1. [PlanetScale](https://planetscale.com) hesabı oluşturun
2. Yeni database oluşturun
3. Connection string'i kopyalayın
4. `DATABASE_URL` olarak ekleyin

### 4. Database Migration

Deployment sonrası veritabanı migration'larını çalıştırın:

```bash
# Vercel CLI ile
vercel env pull .env.local
npx prisma migrate deploy
npx prisma generate
```

### 5. Build ve Deploy

1. Vercel otomatik olarak build edecek
2. Build loglarını kontrol edin
3. Domain'inizi test edin

## Environment Variables Açıklaması

- `DATABASE_URL`: PostgreSQL veritabanı bağlantı string'i
- `NEXTAUTH_URL`: Uygulamanızın production URL'i
- `NEXTAUTH_SECRET`: NextAuth.js için güvenli secret key (32+ karakter)

## Troubleshooting

### Build Hataları
- Node.js version'ını kontrol edin (18+ önerilir)
- Dependencies'leri kontrol edin
- TypeScript hatalarını düzeltin

### Database Bağlantı Hataları
- Connection string'i kontrol edin
- Database'in erişilebilir olduğundan emin olun
- SSL ayarlarını kontrol edin

### NextAuth Hataları
- `NEXTAUTH_URL`'in doğru olduğundan emin olun
- `NEXTAUTH_SECRET`'in güvenli olduğundan emin olun
- Callback URL'lerini kontrol edin

## Monitoring

- Vercel Analytics'i etkinleştirin
- Error tracking için Sentry ekleyin
- Database performance'ını izleyin
