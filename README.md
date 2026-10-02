# Hanyang Research Institute for Contemporary Korean Studies

An English-language, multi-page static site built with HTML, CSS, and JavaScript.

## GitHub Pages

This repository deploys the contents of `site/` with GitHub Actions. The default project URL is `https://yaechanlee.github.io/RICKS/`. The supplied Hanyang logo is used as the browser icon and social sharing image; the Hanyang campus photograph remains the page background.

## Before official launch

- Replace sample review and commentary titles, summaries, author names, dates, and placeholder links with approved content.
- The director’s message is marked as proposed and should be approved before publication.
- Confirm the Institute’s address, office details, membership, and activities.

The homepage carousel opens on “Reading Korea in the past and present,” then fades to the current featured publication. Set `data-featured="true"` on the current review in `index.html` and `reviews.html`; its title, category, and byline appear in the second slide.
