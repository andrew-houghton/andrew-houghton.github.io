module.exports = {
	globDirectory: '.',
	globPatterns: [
		'**/*.{png,js,svg,ico,html,json,md,css}'
	],
	swDest: 'sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	],
	additionalManifestEntries: [
		{revision:"1", url:'https://api.wikiriver.com/email/gauges.js'},
	],
};