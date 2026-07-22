css:
	npx sass css/style.scss css/style.css --source-map
	npx sass css/style.scss css/style.min.css --style=compressed --source-map

lint:
	npx eslint src/
	npx prettier --check src/

typecheck:
	npx tsc --noEmit

build: css
	npx tsc

up:
	docker compose up -d

down:
	docker compose down

.PHONY: css lint typecheck build up down
