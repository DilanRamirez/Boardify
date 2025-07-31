develop:
	npm run dev

format:
	npx prettier . --write --ignore-path .gitignore

check-format:
	npx prettier . --check --ignore-path .gitignore

lint:
	npx eslint . --ext .js,.jsx,.ts,.tsx

types:
	npx tsc --noEmit

test-all: format check-format types