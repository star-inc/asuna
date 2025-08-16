// Asuna - Tiny and blazing-fast microservice framework.
// SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

import { serve } from "bun";
import { rootRouter } from "../init/router.ts";

// Get the fetch function from the root router
const { fetch } = rootRouter;

// Start the server
serve({ fetch, reusePort: true });
