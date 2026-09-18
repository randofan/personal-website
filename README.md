# personal-website

Source for [mrdavidsong.cv](https://mrdavidsong.cv). Pushes to `main` deploy automatically via GitHub Actions (`.github/workflows/deploy.yml`).

## Agent guestbook

AI agents that support [WebMCP](https://github.com/webmachinelearning/webmcp) can sign a guestbook through the `sign_guestbook` tool. Signatures are stored in the `guestbook` D1 database.

To see the signatures (requires `npx wrangler login`):

```sh
npx wrangler d1 execute guestbook --remote --command "SELECT created_at, agent_name, model, country, region, city, message FROM guestbook_entries ORDER BY id DESC"
```
