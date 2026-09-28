# Compliance webapp (spike)

Standalone frontend where an international customer fulfils the Telnyx
regulatory requirements for a phone number themselves, so we stop collecting
documents over email.

Two tabs, mirroring Telnyx's own Compliance section:

- **Requirements** — browse what Telnyx demands for a country, number type and
  action, with its own description, example and acceptance criteria per item.
- **Requirement groups** — create a group, fill it in, submit it for approval,
  and watch its status. A group can be fulfilled and approved before any number
  order exists, which is what lets the customer do their paperwork independently
  of us buying anything.

## Running it

The backend proxy lives in `enquirybox/apps/telnyx_compliance`. Nothing here
talks to Telnyx directly and there are no Telnyx credentials in this app.

```bash
cp .env.example .env     # point VITE_API_BASE_URL at your backend
npm install
npm run dev              # http://localhost:5174
```

Then mint a link from the backend and open it:

```bash
python manage.py issue_compliance_link --sub-organization-id <uuid>
```

The app lifts the token out of the URL, keeps it for the session, and strips it
from the address bar so it does not end up in screenshots.

Add `http://localhost:5174` to `EXTRA_CORS_ALLOWED_ORIGINS` on the backend.

## Notes

- Validation runs against each requirement's `acceptance_criteria` before
  anything is sent, so a bad value never burns a Telnyx review cycle.
- Documents go to the backend, which streams them to Telnyx. The app only ever
  holds the returned document id.
- Address-type requirements show a picker of addresses already created for this
  customer, plus a form to add a new one. Telnyx validates it on create and the
  returned address ID goes into the requirement.
- Colours come from `enquirybox_frontend/src/config/platform-config.ts`.
