# Playfair Display Heading Subset

This folder should contain the subsetted Playfair Display font used exclusively for the main LCP heading ("Kleines Kameel").

## How to generate the subset

1. Make sure you have Node.js installed.
2. Run the following command from this folder:

```powershell
npx glyphhanger --subset=".../node_modules/@fontsource/playfair-display/files/playfair-display-latin-500-normal.woff2" --whitelist="The El-Aurian AtriumabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789äöüÄÖÜß.,!?'-:;()" --output=playfair-display-heading-subset.woff2
```

3. After the command finishes, the file `playfair-display-heading-subset.woff2` should appear in this folder.

4. Rebuild the project:
   ```bash
   cd ..\..\.. 
   npm run build
   ```

The subset font will only contain the characters needed for the heading, resulting in a much smaller file size and faster rendering for the LCP element.
