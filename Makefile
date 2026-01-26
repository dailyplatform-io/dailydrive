.PHONY: start-dev stop-dev logs-dev rebuild-dev

start-dev:
	docker compose up --build

stop-dev:
	docker compose down --remove-orphans

logs-dev:
	docker compose logs -f

rebuild-dev:
	docker compose down --remove-orphans
	docker compose up --build
