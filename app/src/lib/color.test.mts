import assert from "node:assert/strict"
import { test } from "node:test"

import {
  compositeOn,
  contrastRatio,
  formatColor,
  hslToRgba,
  isWritableValue,
  parseColor,
  rgbaToHsl,
  rgbaToOklch,
  toBrandValue,
  type Rgba,
} from "./color.ts"

const gratia = {
  primary: parseColor("rgb(35, 221, 156)")!,
  tertiary: parseColor("rgb(242, 245, 245)")!,
  surface: parseColor("rgba(255, 255, 255, 1)")!,
  text: parseColor("rgb(1, 25, 26)")!,
  badInk: parseColor("rgb(120, 140, 138)")!,
}

test("parses every format brand.json and designers use", () => {
  assert.deepEqual(parseColor("rgb(35, 221, 156)"), { r: 35, g: 221, b: 156, a: 1 })
  assert.deepEqual(parseColor("rgba(1, 25, 26, 0.18)"), { r: 1, g: 25, b: 26, a: 0.18 })
  assert.deepEqual(parseColor("#01191A"), { r: 1, g: 25, b: 26, a: 1 })
  assert.deepEqual(parseColor("#abc"), { r: 170, g: 187, b: 204, a: 1 })
  assert.equal(parseColor("chartreuse"), null)
  assert.equal(parseColor("rgb(1 25 26)"), null)
})

test("round-trips oklch through sRGB within a channel step", () => {
  for (const source of ["rgb(35, 221, 156)", "rgb(1, 25, 26)", "rgb(180, 110, 10)"]) {
    const rgba = parseColor(source)!
    const back = parseColor(formatColor(rgba, "oklch"))!
    for (const channel of ["r", "g", "b"] as const) {
      assert.ok(
        Math.abs(back[channel] - rgba[channel]) <= 1,
        `${source} ${channel}: ${back[channel]} vs ${rgba[channel]}`
      )
    }
  }
})

test("parses oklch with and without alpha", () => {
  const opaque = parseColor("oklch(0.7 0.15 165)")
  assert.ok(opaque && opaque.a === 1)
  const translucent = parseColor("oklch(0.7 0.15 165 / 0.5)")
  assert.ok(translucent && translucent.a === 0.5)
})

test("never writes oklch to brand.json", () => {
  const c = parseColor("oklch(0.7 0.15 165)")!
  const written = toBrandValue(c, "oklch")
  assert.ok(!written.includes("oklch"))
  assert.ok(isWritableValue(written), written)
})

test("writes rgba when hex would drop alpha", () => {
  const translucent: Rgba = { r: 1, g: 25, b: 26, a: 0.18 }
  assert.equal(toBrandValue(translucent, "hex"), "rgba(1, 25, 26, 0.18)")
  assert.equal(toBrandValue({ ...translucent, a: 1 }, "hex"), "#01191A")
})

test("isWritableValue matches what validate-brand.js accepts", () => {
  assert.ok(isWritableValue("rgb(1, 2, 3)"))
  assert.ok(isWritableValue("rgba(1, 2, 3, 0.5)"))
  assert.ok(isWritableValue("#01191A"))
  assert.ok(!isWritableValue("#abc"), "3-digit hex is rejected by the validator")
  assert.ok(!isWritableValue("oklch(0.7 0.15 165)"))
})

test("contrast agrees with the validator's numbers", () => {
  assert.equal(contrastRatio(gratia.text, gratia.tertiary).toFixed(2), "16.58")
  assert.equal(contrastRatio(gratia.badInk, gratia.primary).toFixed(2), "2.01")
  assert.equal(contrastRatio(gratia.text, gratia.primary).toFixed(2), "10.30")
  const ink = compositeOn(gratia.text, gratia.surface)
  assert.equal(contrastRatio(ink, gratia.surface).toFixed(2), "18.18")
})

test("compositing only moves translucent colours", () => {
  const opaque = { r: 1, g: 25, b: 26, a: 1 }
  assert.deepEqual(compositeOn(opaque, gratia.surface), opaque)
  const half = compositeOn({ r: 0, g: 0, b: 0, a: 0.5 }, { r: 255, g: 255, b: 255, a: 1 })
  assert.deepEqual(half, { r: 127.5, g: 127.5, b: 127.5, a: 1 })
})

test("round-trips HSL", () => {
  for (const source of ["rgb(35, 221, 156)", "rgb(180, 30, 65)", "rgb(242, 245, 245)"]) {
    const rgba = parseColor(source)!
    const back = hslToRgba(rgbaToHsl(rgba), rgba.a)
    assert.deepEqual({ r: back.r, g: back.g, b: back.b }, { r: rgba.r, g: rgba.g, b: rgba.b })
  }
})

test("greys report no hue", () => {
  const [, chroma, hue] = rgbaToOklch({ r: 128, g: 128, b: 128, a: 1 })
  assert.ok(chroma < 0.001)
  assert.equal(hue, 0)
})
