
# Member 4 – Dashboard and Reports Integration Requirements

## Responsibility
Member 4 is responsible for the Admin Dashboard, Revenue Chart, Reports and integration of application modules.

## 1. Dashboard Data Requirements

The backend should provide data for:

- Total revenue from successful payments.
- Number of active subscriptions.
- Total outstanding invoice balance.
- Upcoming subscription renewals.
- Monthly revenue breakdown.

## 2. Reports Data Requirements

The Reports module needs:

- Successful payment records.
- Invoice amounts and outstanding balances.
- Subscription status and plan details.
- Customer information.
- Monthly revenue data.
- Revenue grouped by subscription plan.

## 3. Integration Requirements

- Dashboard and Reports must use backend data rather than hardcoded sample figures.
- Revenue calculations must use successful payments.
- Outstanding balances must exclude fully paid invoices.
- Subscription counts must use actual subscription statuses.
- Date filters must apply to the selected reporting period.
- API errors and loading states should be handled in the frontend.

## 4. Backend Information Needed

The backend developer should share:

- API base URL.
- Dashboard API endpoints.
- Reports API endpoints.
- Authentication requirements.
- Response JSON structures.
- Database schema and instructions to run the backend.

## 5. Testing

- Verify dashboard totals against backend records.
- Verify monthly revenue calculations.
- Verify report filters.
- Verify invoice and subscription data.
- Test API failures and empty data responses.

## Status

Requirements documented. API integration will begin after the backend endpoints and response formats are available.
git status