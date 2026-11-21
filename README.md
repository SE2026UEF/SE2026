1. Asenna riippuvuudet
   ```bash
   npm install
   ```

2. Kopioi `.env.example` tiedostoksi `.env` ja täytä arvot:

   ```env
   COC_API_TOKEN="api-avain"
   DATABASE_URL="mysql://käyttäjä:salasana@localhost:3306/coc_tracker"
   ```

3. Luo tietokanta ja taulut. Jos tietokantaa ei vielä ole, komento luo sen.
   Valinnaisena voit lisätä testidataa seedillä.

   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. Käynnistä kehityspalvelin:

   ```bash
   npm run dev
   ```

5. Avaa selaimessa http://localhost:3000.
