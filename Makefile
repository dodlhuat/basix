DEPLOY_HOST := world4you
DEPLOY_DIR  := web/basix/

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

deploy: ## rsync the whole repo (minus node_modules/.git) to world4you:web/basix/
	rsync -avz --delete \
		--exclude='/.git/' \
		--exclude='/node_modules/' \
		--exclude='/.env' \
		--exclude='/.claude/' \
		$(CURDIR)/ $(DEPLOY_HOST):$(DEPLOY_DIR)

.PHONY: css lint typecheck build up down deploy
