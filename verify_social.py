import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        # Ensure server is up (already running in background)
        try:
            await page.goto('http://localhost:5173', timeout=60000)
            print("Page loaded")
            # Wait for social links to be visible
            await page.wait_for_selector('.social-links', timeout=10000)
            print("Social links found")
            await page.screenshot(path='home_header.png')
            print("Screenshot saved to home_header.png")
        except Exception as e:
            print(f"Error: {e}")
            # Try taking a screenshot of whatever is there
            await page.screenshot(path='error_screenshot.png')
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
