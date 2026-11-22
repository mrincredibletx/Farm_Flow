import asyncio
import os
import glob
import subprocess
from playwright.async_api import async_playwright

RECORDING_DIR = r"c:\Users\rkban\OneDrive\Desktop\sem 7\PROJECT\video_production\recordings"
OUTPUT_DIR = r"c:\Users\rkban\OneDrive\Desktop\sem 7\PROJECT\video_production\output"
os.makedirs(RECORDING_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def record_full_demo():
    print("Starting Playwright Screen Recording of Live System...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--window-size=1920,1080",
                "--enable-webgl",
                "--ignore-gpu-blocklist",
                "--use-gl=angle"
            ]
        )
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=RECORDING_DIR,
            record_video_size={"width": 1920, "height": 1080}
        )
        page = await context.new_page()

        print("Navigating to http://localhost:3000...")
        await page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
        await asyncio.sleep(3)

        # 1. Landing State & GPS Detection
        print("Capturing Landing State & GPS...")
        await page.mouse.move(960, 540)
        await asyncio.sleep(2)

        # 2. Draw Agricultural Parcel Polygon
        print("Drawing agricultural parcel polygon on satellite map...")
        draw_btn = page.locator("button:has-text('Draw Boundary')").first
        if await draw_btn.is_visible():
            await draw_btn.click()
            await asyncio.sleep(1)
            # Click 4 vertices on map to enclose research plot
            await page.mouse.click(750, 350)
            await asyncio.sleep(0.8)
            await page.mouse.click(1250, 360)
            await asyncio.sleep(0.8)
            await page.mouse.click(1280, 750)
            await asyncio.sleep(0.8)
            await page.mouse.click(760, 720)
            await asyncio.sleep(0.8)
            finish_btn = page.locator("button:has-text('Finish Drawing')").first
            if await finish_btn.is_visible():
                await finish_btn.click()
            await asyncio.sleep(1.5)

        # 3. Trigger Terrain & Drainage Analysis
        print("Triggering Analyze Terrain & Drainage...")
        analyze_btn = page.locator("button:has-text('Analyze Terrain & Drainage')").first
        if await analyze_btn.is_visible():
            await analyze_btn.click()
            print("Calculation in progress, waiting for NumPy solvers...")
            await asyncio.sleep(6)

        # 4. Explore Hydrology Assessment
        print("Exploring Hydrology Tab & Topographic Relief...")
        await asyncio.sleep(4)

        # 5. Switch to A* Ditching Tab
        print("Switching to A* Ditching Tab...")
        ditching_tab = page.locator("button:has-text('A* Ditching')").first
        if await ditching_tab.is_visible():
            await ditching_tab.click()
            await asyncio.sleep(4)

        # 6. Switch to Cut/Fill Tab
        print("Switching to Cut/Fill Grading Tab...")
        grading_tab = page.locator("button:has-text('Cut/Fill')").first
        if await grading_tab.is_visible():
            await grading_tab.click()
            await asyncio.sleep(3)

            profile_btn = page.locator("button:has-text('Elevation Transect Profile')").first
            if await profile_btn.is_visible():
                await profile_btn.click()
                await asyncio.sleep(3)
                close_btn = page.locator("button:has-text('Close')").first
                if await close_btn.is_visible():
                    await close_btn.click()
                await asyncio.sleep(1)

        # 7. Switch to ML Risk Tab
        print("Switching to ML Risk Tab...")
        risk_tab = page.locator("button:has-text('ML Risk')").first
        if await risk_tab.is_visible():
            await risk_tab.click()
            await asyncio.sleep(3)
            # Find rainfall slider
            sliders = page.locator("input[type='range']")
            if await sliders.count() > 0:
                s = sliders.first
                box = await s.bounding_box()
                if box:
                    await page.mouse.click(box["x"] + box["width"] * 0.75, box["y"] + box["height"] / 2)
            await asyncio.sleep(3)

        # 8. Switch to Gemini AI Advisory Tab
        print("Switching to Gemini AI Advisory Tab...")
        advisory_tab = page.locator("button:has-text('Gemini AI')").first
        if await advisory_tab.is_visible():
            await advisory_tab.click()
            await asyncio.sleep(5)

        # 9. Switch to 3D Terrain Mesh Viewer
        print("Switching to 3D Terrain Mesh Viewer...")
        view_3d_btn = page.locator("button:has-text('3D Terrain Mesh')").first
        if await view_3d_btn.is_visible():
            await view_3d_btn.click()
            await asyncio.sleep(4)

            # Orbit camera smoothly
            canvas = page.locator("canvas").first
            if await canvas.is_visible():
                cbox = await canvas.bounding_box()
                if cbox:
                    cx = cbox["x"] + cbox["width"] / 2
                    cy = cbox["y"] + cbox["height"] / 2
                    print("Performing smooth 3D camera orbit...")
                    await page.mouse.move(cx, cy)
                    await page.mouse.down()
                    for step in range(35):
                        await page.mouse.move(cx + step * 7, cy - (step % 8) * 4)
                        await asyncio.sleep(0.08)
                    await page.mouse.up()
                    await asyncio.sleep(2)

            # Start Rain Simulation
            print("Activating 3D Rain & Dynamic Inundation...")
            start_rain = page.locator("button:has-text('Start Rain')").first
            if await start_rain.is_visible():
                await start_rain.click()
                print("Rain started, observing particle physics & water accumulation...")
                await asyncio.sleep(5)

            # Switch to Design Graded surface
            print("Switching to Design Graded (Cut/Fill) surface...")
            design_btn = page.locator("button:has-text('Design Graded')").first
            if await design_btn.is_visible():
                await design_btn.click()
                await asyncio.sleep(4)

            # Switch back to Existing Ground
            existing_btn = page.locator("button:has-text('Existing Ground')").first
            if await existing_btn.is_visible():
                await existing_btn.click()
                await asyncio.sleep(3)

        # 10. Switch back to 2D GIS Map & Trigger PDF Export
        print("Switching back to 2D GIS Map...")
        view_2d_btn = page.locator("button:has-text('2D GIS Map')").first
        if await view_2d_btn.is_visible():
            await view_2d_btn.click()
            await asyncio.sleep(2)

        print("Triggering Export Agronomic Report (PDF)...")
        pdf_btn = page.locator("button:has-text('Export Agronomic Report'), button:has-text('Export PDF')").first
        if await pdf_btn.is_visible():
            try:
                async with page.expect_download(timeout=8000):
                    await pdf_btn.click()
                print("PDF Report downloaded successfully!")
            except Exception as e:
                print("PDF triggered (direct save or print):", e)
            await asyncio.sleep(3)

        print("Demonstration sequence complete! Closing browser and flushing recording...")
        await page.close()
        await context.close()
        await browser.close()

def convert_recording_to_mp4():
    # Find latest webm in recordings
    webms = glob.glob(os.path.join(RECORDING_DIR, "*.webm"))
    if not webms:
        print("No webm recording found!")
        return
    latest_webm = max(webms, key=os.path.getmtime)
    print(f"Latest webm: {latest_webm} ({os.path.getsize(latest_webm)} bytes)")

    out_mp4 = os.path.join(OUTPUT_DIR, "Project_Demonstration.mp4")
    print(f"Re-encoding to high-fidelity 1080p 60fps MP4: {out_mp4}...")
    
    cmd = [
        'ffmpeg', '-y', '-i', latest_webm,
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
        '-r', '60', '-pix_fmt', 'yuv420p',
        out_mp4
    ]
    subprocess.run(cmd, check=True)
    print(f"Project_Demonstration.mp4 successfully created! Size: {os.path.getsize(out_mp4)} bytes")

if __name__ == "__main__":
    asyncio.run(record_full_demo())
    convert_recording_to_mp4()
