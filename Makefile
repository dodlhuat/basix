css:
	sass css/style.scss css/style.css --source-map
	sass css/style.scss css/style.min.css --style=compressed --source-map

.PHONY: css
