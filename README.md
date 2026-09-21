# La Bilbaina Submarine Factory — Ordering Site

This is a self-contained, single-file website (`index.html`) for all four
concepts: La Bilbaina Submarine Factory, Romero's Lonestar Grill, Mom's
Tex-Mex Bowls, and Z's Empanadas. It needs no build step and no external
services to load — just to be hosted.

**Current status:** front-end only. The menu, cart, and checkout flow are
fully functional in the browser, but no order or payment is actually sent
anywhere yet. See "Connecting to Square" below for what that requires.

---

## Part 1 — Put the code on GitHub

1. Create a new repository on GitHub (e.g. `la-bilbaina-site`). Leave it
   empty — no README, no .gitignore.
2. In a terminal, from this folder:
   ```bash
   git init
   git add index.html vercel.json README.md
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/la-bilbaina-site.git
   git push -u origin main
   ```
   (Replace `<your-username>` with your GitHub username, and the repo name
   if you picked a different one.)

## Part 2 — Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in (Vercel lets
   you sign in directly with your GitHub account).
2. Click **Import** next to the `la-bilbaina-site` repo.
3. Leave all settings as default (no framework, no build command needed —
   it's a static HTML file) and click **Deploy**.
4. Vercel gives you a live URL immediately, e.g.
   `la-bilbaina-site.vercel.app`.

### Pointing your real domain (labilbainasubs.com)

1. In the Vercel project, go to **Settings → Domains** and add
   `labilbainasubs.com`.
2. Vercel shows you either an A record or a CNAME to add. Add that record
   with whoever manages your domain's DNS (GoDaddy, Namecheap, etc.).
3. DNS changes can take anywhere from a few minutes to a few hours to
   take effect.

### Making future edits live

Any time the menu or design needs to change: edit `index.html`, then:
```bash
git add index.html
git commit -m "Update menu"
git push
```
Vercel automatically redeploys on every push to `main` — no extra steps.

---

## Part 3 — Connecting to Square (separate project)

The site currently cannot place real orders or take real payment. To make
"Place Order" actually create an order on your Square Register and charge
a card, you need:

1. **A Square Developer account** — go to
   [developer.squareup.com](https://developer.squareup.com) and sign in
   with your existing Square (business) login. This gives you API access
   without touching your live register.
2. **An Application** inside that developer dashboard, which gives you:
   - A **Location ID** (identifies which of your Square locations orders
     should land on)
   - Sandbox credentials (for testing) and Production credentials (for
     real orders/payments)
3. **A small backend** (a few serverless functions is enough — Vercel
   supports these natively, so this can live in the same project) that:
   - Uses the **Orders API** to create the order server-side
   - Uses the **Web Payments SDK** + **Payments API** to securely collect
     and charge a card
   - Keeps your **access token secret** — it must never be shipped to the
     browser, only used inside the backend functions

This is meaningfully more work than the deploy above — it's a real
integration project, not a config toggle. Once you've created the Square
Developer account and have a Location ID + sandbox credentials, that's
the point to come back and build this part.
