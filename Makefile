css:
	sass css/style.scss css/style.css --source-map
	sass css/style.scss css/style.min.css --style=compressed --source-map

lint:
	npx eslint src/
	npx prettier --check src/

up:
	docker compose up -d

down:
	docker compose down

.PHONY: css lint up down
