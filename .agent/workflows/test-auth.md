---
description: Test credentials for browser testing
---

# Test User Credentials

Use these credentials when testing the app in the browser:

- **Email**: `test@example.com`
- **Password**: `TestPass123!`

## To create/reset the test user

Run the following command from the project root:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-test-user.ts
```

## Notes

- The test user has username: `testuser`
- After running the seed script, you can log in with the credentials above
- The test user will have a sample profile set up
