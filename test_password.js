const bcrypt = require('bcryptjs');

// Test passwords and their hashes from the schema
const testCases = [
  {
    email: 'admin@system.com',
    password: 'admin123',
    hash: '$2b$10$q7o64Tc2NMk6r4xL1Xpbcu.sZEOMZLdU8/kO7MqT04/KREU4mNwHu'
  },
  {
    email: 'Faker@owner.com',
    password: 'Faker123',
    hash: '$2b$10$sECRcIZAxE9rzfpWzm3ioeimIO1puayFHa8fYYasqkGZTZ8m8XgRe'
  },
  {
    email: 'Yura@owner.com',
    password: 'Yura123',
    hash: '$2b$10$XkV0HY/KUTPAF3CRjYY0rO3C.VUB88JHwta7l3VSKJAAOTS9mRTxq'
  }
];

console.log('Testing password hashes...\n');

testCases.forEach(test => {
  const isValid = bcrypt.compareSync(test.password, test.hash);
  console.log(`${test.email}`);
  console.log(`  Password: ${test.password}`);
  console.log(`  Hash: ${test.hash}`);
  console.log(`  Valid: ${isValid ? '✓ YES' : '✗ NO'}`);
  console.log('');
});

// Generate fresh hashes for comparison
console.log('\n=== Fresh Hashes (for comparison) ===\n');
testCases.forEach(test => {
  const freshHash = bcrypt.hashSync(test.password, 10);
  console.log(`${test.email}: ${test.password}`);
  console.log(`  New hash: ${freshHash}`);
  console.log(`  Matches: ${bcrypt.compareSync(test.password, freshHash) ? '✓' : '✗'}`);
  console.log('');
});
