# Default Login Credentials

## Admin Account
- **Email**: admin@system.com
- **Password**: admin123
- **Role**: admin
- **Permissions**: Full access to all features, can manage all owners

---

## Owner Accounts

### 1. Faker
- **Email**: Faker@owner.com
- **Password**: Faker123
- **Role**: owner
- **Status**: active

### 2. Yura
- **Email**: Yura@owner.com
- **Password**: Yura123
- **Role**: owner
- **Status**: active

### 3. 0xGiant
- **Email**: 0xGiant@owner.com
- **Password**: 0xGiant123
- **Role**: owner
- **Status**: active

### 4. 0xStrong
- **Email**: 0xStrong@owner.com
- **Password**: 0xStrong123
- **Role**: owner
- **Status**: active

### 5. Voldmot
- **Email**: Voldmot@owner.com
- **Password**: Voldmot123
- **Role**: owner
- **Status**: active

### 6. Rape
- **Email**: Rape@owner.com
- **Password**: Rape123
- **Role**: owner
- **Status**: active

---

## Password Hashes (for reference)

These bcrypt hashes are already included in `COMPLETE_SUPABASE_SCHEMA.sql`:

```
admin123:     $2b$10$q7o64Tc2NMk6r4xL1Xpbcu.sZEOMZLdU8/kO7MqT04/KREU4mNwHu
Faker123:     $2b$10$sECRcIZAxE9rzfpWzm3ioeimIO1puayFHa8fYYasqkGZTZ8m8XgRe
Yura123:      $2b$10$XkV0HY/KUTPAF3CRjYY0rO3C.VUB88JHwta7l3VSKJAAOTS9mRTxq
0xGiant123:   $2b$10$OoiazlcEU1FTjmhjSgmtDeUJfKYkaYDQLhsE3rK3AzU170KVAIB3e
0xStrong123:  $2b$10$a7GJ.YYEQ7ecZoOy0PQlbO9kVL9.7hfuC.6aXUIBXaqfj9o.w3Doi
Voldmot123:   $2b$10$UovMlOb2OdUlyeH4zaegZOJB4JGXq2Ta2DsdNjORN1BTpkkLwEfda
Rape123:      $2b$10$pa05fcUM/.PwPlQlP4wynOmNEXYZmGkSO3z3TUSF.nvOmZ9n36J1q
```

---

## Quick Test

After running `COMPLETE_SUPABASE_SCHEMA.sql`, you can test login with any of these accounts:

1. Go to your application login page
2. Enter email and password from above
3. You should be logged in successfully

---

## Security Notes

⚠️ **IMPORTANT**: These are default credentials for development/testing only!

For production:
1. Change all passwords immediately
2. Delete unused accounts
3. Use strong, unique passwords
4. Enable 2FA if available
5. Regularly audit user accounts
