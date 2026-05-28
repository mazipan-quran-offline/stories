#!/usr/bin/env node
// Regenerates src/index.html (the landing page) from content.json.
//
// This is an on-demand sync script — it is intentionally NOT part of `pnpm run build`.
// Run it locally whenever content.json changes (new story, edited metadata) so the
// landing page cards stay in sync with the actual story pages:
//
//   pnpm run generate:index
//
// Then commit the regenerated src/index.html.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatDateID, loadContent, loadStories, REPO_ROOT } from './content.mjs';

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderCard(story) {
  return `				<li class="card" style="background-image: ${story.gradient};">
					<a href="/stories/${story.slug}/">
						<h3>${escapeHtml(story.title)}</h3>
					</a>
					<small>${formatDateID(story.publishedDate)}</small>
					<p>${escapeHtml(story.description)}</p>
				</li>`;
}

function buildIndex() {
  const { site } = loadContent();
  const cards = loadStories().map(renderCard).join('\n');

  return `<!DOCTYPE html>
<html lang="id-ID">

<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
	<title>${escapeHtml(site.title)}</title>

	<meta itemprop="name" content="${escapeHtml(site.title)}">
	<meta name="description" content="${escapeHtml(site.description)}" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content="https://www.baca-quran.id/meta-image.png" />
	<meta name="twitter:site" content="@maz_ipan" />

	<meta property="og:title" content="${escapeHtml(site.title)}" />
	<meta property="og:description" content="${escapeHtml(site.description)}" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="${site.baseUrl}/" />
	<meta property="og:image" content="https://www.baca-quran.id/meta-image.png" />

	<link rel='icon' type='image/png' href='https://www.baca-quran.id/icon-32.png'>

	<link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
	<style>
		html {
			line-height: 1.15;
			-webkit-text-size-adjust: 100%
		}

		body {
			margin: 0
		}

		main {
			display: block
		}

		h1 {
			font-size: 2em;
			margin: .67em 0
		}

		a {
			background-color: transparent
		}

		b,
		strong {
			font-weight: bolder
		}

		small {
			font-size: 80%
		}

		img {
			border-style: none
		}

		body {
			color: hsla(0, 0%, 0%, 0.9);
			font-family: 'Merriweather', serif;
			font-weight: 400;
			word-wrap: break-word;
			font-kerning: normal;
			-moz-font-feature-settings: "kern", "liga", "clig", "calt";
			-ms-font-feature-settings: "kern", "liga", "clig", "calt";
			-webkit-font-feature-settings: "kern", "liga", "clig", "calt";
			font-feature-settings: "kern", "liga", "clig", "calt";
			background-color: #fafafa;
		}

		.wrapper {
			margin-left: auto;
			margin-right: auto;
			max-width: 42rem;
			padding: 2.625rem 1.3125rem;
		}

		.title {
			font-size: 3.95285rem;
			line-height: 4.375rem;
			margin-bottom: 2.625rem;
			margin-top: 0;
			font-weight: 700;
		}

		.title a {
			text-decoration: none;
			color: #333;
		}

		article {
			min-height: 70vh;
		}

		.cards {
			list-style: none;
			margin: 0;
			padding: 0;
			display: grid;
			grid-template-columns: 1fr;
			gap: 1.25rem;
		}

		@media (min-width: 34rem) {
			.cards {
				grid-template-columns: 1fr 1fr;
			}
		}

		.card {
			position: relative;
			overflow: hidden;
			border-radius: 18px;
			padding: 1.5rem 1.4rem;
			color: #fff;
			box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
			transition: transform .2s ease, box-shadow .2s ease;
		}

		.card:hover {
			transform: translateY(-4px);
			box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
		}

		.card a {
			color: #fff;
			text-decoration: none;
		}

		.card h3 {
			font-size: 1.4427rem;
			margin: 0 0 .35em;
			line-height: 1.25;
		}

		.card small {
			display: block;
			opacity: .9;
			font-size: .8rem;
			letter-spacing: .03em;
		}

		.card p {
			margin: .6em 0 0;
			line-height: 1.6;
			font-size: .95rem;
			opacity: .96;
		}

		footer {
			padding: .5em 1em;
			width: 100%;
			text-align: center;
			font-size: 0.9rem;
		}

		footer a {
			color: #007acc;
			text-decoration: none;
		}
	</style>
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-25065548-8"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'UA-25065548-8');
</script>
</head>

<body>
	<main class="wrapper">
		<header>
			<h1 class="title"><a aria-current="page" href="/stories/">Web Stories</a></h1>
		</header>
		<article>
			<ul class="cards">
${cards}
			</ul>
		</article>
	</main>

	<div class="adswrapper" style="width:100%;width:flex;justify-content:center;align-items:cecnter;">
		<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
		<!-- Responsive 2019 -->
		<ins class="adsbygoogle"
				 style="display:block"
				 data-ad-client="ca-pub-5442972248172818"
				 data-ad-slot="4265678371"
				 data-ad-format="auto"
				 data-full-width-responsive="true"></ins>
		<script>
				 (adsbygoogle = window.adsbygoogle || []).push({});
		</script>
	</div>

	<footer>
		<a href="/">Baca-Quran.id</a> © 2020
                <p>
                  Built with ❤️ by
		  <a target="_blank" rel="noopener noreferrer" href="https://mazipan.space/">Irfan Maulana</a>
                  <br/>
                  <a href="https://www.baca-quran.id/tulisan/">BacaQuran.id Web Blog</a>
                  <br /><br />
                  <span>Cek juga: </span>
        <a href="https://ksana.in" target="_blank" rel="noopener noreferrer">
          Ksana.in
        </a>
        <span>, </span>
        <a href="https://pramuka.online" target="_blank" rel="noopener noreferrer">
          Pramuka.Online
        </a>
                </p>
	</footer>
</body>

</html>
`;
}

const outPath = join(REPO_ROOT, 'src', 'index.html');
writeFileSync(outPath, buildIndex());
console.log(`Generated ${outPath}`);
