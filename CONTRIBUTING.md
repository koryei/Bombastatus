# Contributing

Thanks for helping out!

```bash
git clone https://github.com/koryei/Bombastatus.git
cd Bombastatus
npm install
npm test
```

- Keep commits **atomic**: one logical change per commit, with a [Conventional Commits](https://www.conventionalcommits.org/) message (`feat:`, `fix:`, `docs:`, `test:`, `chore:`…).
- Add or update tests in `test/` for behavior changes. `src/schedule.js` is pure logic and easy to test.
- Never commit your token, `.env` or `config.json`. Redact tokens from logs in issues.
- The only runtime dependency is `ws`. Please keep it that way unless there is a strong reason.
