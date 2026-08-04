import { test, expect } from "@playwright/test";

const QUOTE_PATH = "/quote";

// Mock the POST /api/quotes endpoint to avoid DB dependency
const MOCK_REF = "STG-Q-20260804-ABCD12";
const MOCK_SUCCESS = {
  id: "mock-id-1",
  referenceNumber: MOCK_REF,
  contactName: "Jane Doe",
  contactEmail: "jane@example.com",
  status: "pending",
  createdAt: new Date().toISOString(),
};

const SERVICES = [
  "air_freight",
  "ocean_freight",
  "ocean_freight_lcl",
  "rail_freight",
  "road_freight",
  "customs_clearance",
  "warehousing",
];

/** Fill the required fields common to all happy-path tests. */
async function fillRequiredFields(page: import("@playwright/test").Page, overrides: Record<string, string> = {}) {
  await page.fill('[data-testid="input-contact-name"]', overrides.contactName ?? "Jane Doe");
  await page.fill('[data-testid="input-contact-email"]', overrides.contactEmail ?? "jane@example.com");
  await page.fill('input[id="originCity"]', overrides.originCity ?? "Shenzhen");
  await page.fill('input[id="originCountry"]', overrides.originCountry ?? "China");
  await page.fill('input[id="destinationCity"]', overrides.destinationCity ?? "Frankfurt");
  await page.fill('input[id="destinationCountry"]', overrides.destinationCountry ?? "Germany");
}

test.describe("Quote form — happy path", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept the API call so tests never hit the database
    await page.route("**/api/quotes", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(MOCK_SUCCESS),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(QUOTE_PATH);
  });

  test("fills all required fields, submits, and shows confirmation with reference number", async ({ page }) => {
    await fillRequiredFields(page);
    await page.click('[data-testid="service-option-air_freight"]');
    await page.click('[data-testid="button-submit-quote"]');

    // Confirmation card should appear
    await expect(page.getByText("Quote Request Received!")).toBeVisible();

    // Reference number from the mocked response should be shown
    await expect(page.getByText(MOCK_REF)).toBeVisible();
  });

  test("shows confirmation with a fallback reference if the server omits referenceNumber", async ({ page }) => {
    // Override the route to return a response without referenceNumber
    await page.route("**/api/quotes", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ id: "mock-id-2", status: "pending" }),
        });
      } else {
        await route.continue();
      }
    });

    await fillRequiredFields(page);
    await page.click('[data-testid="service-option-ocean_freight"]');
    await page.click('[data-testid="button-submit-quote"]');

    await expect(page.getByText("Quote Request Received!")).toBeVisible();
    // The fallback STG-Q- reference should appear (the form generates one)
    await expect(page.getByText(/STG-Q-/)).toBeVisible();
  });
});

test.describe("Quote form — validation errors", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(QUOTE_PATH);
  });

  test("shows error banner near the submit button when required fields are empty", async ({ page }) => {
    // Click submit without filling anything
    await page.click('[data-testid="button-submit-quote"]');

    // The validation error summary should appear
    const banner = page.getByText("Please fix the following before submitting:");
    await expect(banner).toBeVisible();

    // At least one error message should be listed
    await expect(page.getByText("Name is required")).toBeVisible();
  });

  test("clicking submit with missing fields focuses the first invalid field (contactName)", async ({ page }) => {
    // Fill everything except contactName and service to trigger validation
    await page.fill('[data-testid="input-contact-email"]', "test@example.com");
    await page.fill('input[id="originCity"]', "Shenzhen");
    await page.fill('input[id="originCountry"]', "China");
    await page.fill('input[id="destinationCity"]', "Frankfurt");
    await page.fill('input[id="destinationCountry"]', "Germany");

    await page.click('[data-testid="button-submit-quote"]');

    // contactName should receive focus (setFocus is called in onInvalid)
    const contactNameInput = page.locator('[data-testid="input-contact-name"]');
    await expect(contactNameInput).toBeFocused();
  });

  test("shows service type error when service is not selected", async ({ page }) => {
    await fillRequiredFields(page);
    // Deliberately skip selecting a service type
    await page.click('[data-testid="button-submit-quote"]');

    await expect(page.getByText("Please select a service")).toBeVisible();
  });
});

test.describe("Quote form — all 7 service types", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/quotes", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(MOCK_SUCCESS),
        });
      } else {
        await route.continue();
      }
    });
  });

  for (const service of SERVICES) {
    test(`can select "${service}" and submit successfully`, async ({ page }) => {
      await page.goto(QUOTE_PATH);
      await fillRequiredFields(page);
      await page.click(`[data-testid="service-option-${service}"]`);

      // Verify the button is visually selected (has the dark background class)
      const btn = page.locator(`[data-testid="service-option-${service}"]`);
      await expect(btn).toHaveClass(/bg-\[#0f172a\]/);

      await page.click('[data-testid="button-submit-quote"]');
      await expect(page.getByText("Quote Request Received!")).toBeVisible();
    });
  }
});
