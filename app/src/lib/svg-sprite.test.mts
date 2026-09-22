import assert from "node:assert/strict"
import { test } from "node:test"

import { toSymbolSprite } from "./svg-sprite.ts"

const sample = `<?xml version="1.0" encoding="UTF-8"?>
<!-- a comment -->
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="48" viewBox="0 0 200 48" fill="none">
  <path d="M0 0h20v20H0z" fill="#FF5733"/>
  <circle cx="30" cy="10" r="8" fill="none" stroke="rgb(2,3,4)"/>
</svg>`

test("wraps an svg in a symbol the decks can <use>", () => {
  const sprite = toSymbolSprite(sample, "acme-logo", false)
  assert.match(sprite, /<symbol id="acme-logo" viewBox="0 0 200 48">/)
  assert.equal((sprite.match(/<svg/g) ?? []).length, 1)
  assert.match(sprite, /d="M0 0h20v20H0z"/)
})

test("strips the xml declaration and comments", () => {
  const sprite = toSymbolSprite(sample, "acme-logo", false)
  assert.ok(!sprite.includes("<?xml"))
  assert.ok(!sprite.includes("a comment"))
})

test("recolours to currentColor without touching fill=none", () => {
  const sprite = toSymbolSprite(sample, "acme-logo", true)
  assert.match(sprite, /fill="currentColor"/)
  assert.match(sprite, /stroke="currentColor"/)
  assert.match(sprite, /fill="none"/)
  assert.ok(!sprite.includes("#FF5733"))
})

test("keeps brand colours when recolouring is off", () => {
  const sprite = toSymbolSprite(sample, "acme-logo", false)
  assert.match(sprite, /fill="#FF5733"/)
})

test("derives a viewBox from width and height", () => {
  const sprite = toSymbolSprite(
    '<svg width="64" height="64"><path d="M0 0"/></svg>',
    "x",
    false
  )
  assert.match(sprite, /viewBox="0 0 64 64"/)
})

test("rejects input it cannot turn into a sprite", () => {
  assert.throws(() => toSymbolSprite("hello", "x", false), /not an SVG/)
  assert.throws(
    () => toSymbolSprite("<svg><path/></svg>", "x", false),
    /no viewBox/
  )
})
