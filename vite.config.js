import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "/Taxpath/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), "index.html"),
        companyResearch: resolve(process.cwd(), "company-research.html"),
        signin: resolve(process.cwd(), "signin.html"),
        calculators: resolve(process.cwd(), "calculators.html"),
        loanCalculator: resolve(process.cwd(), "loan-calculator.html"),
        savingsCalculator: resolve(process.cwd(), "savings-calculator.html"),
        taxGstCalculator: resolve(process.cwd(), "tax-gst-calculator.html"),
        investments: resolve(process.cwd(), "investments.html"),
        tax: resolve(process.cwd(), "tax.html"),
        planning: resolve(process.cwd(), "planning.html"),
        news: resolve(process.cwd(), "news.html"),
        learn: resolve(process.cwd(), "learn.html")
      }
    }
  }
});
