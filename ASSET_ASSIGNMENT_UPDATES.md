# Asset Assignment Field Updates

## New Fields Added

The asset assignment functionality has been updated with the following new fields:

### Core Fields
- `asset_assign_id` - Unique identifier for the asset assignment
- `dept_id` - Department ID where the asset is assigned
- `asset_id` - Asset ID being assigned
- `org_id` - Organization ID

### New Action Tracking Fields
- `employee_int_id` - Employee internal ID (replaces `employee_id`)
- `action` - Type of action performed (ASSIGN, UNASSIGN, TRANSFER, RETURN)
- `action_on` - Timestamp when the action was performed
- `action_by` - User ID who performed the action
- `latest_assignment_flag` - Boolean flag indicating if this is the latest assignment

## Implementation Details

### Asset Assignment Creation (`screens/asset/asset_3.js`)
- Updated to include all new fields
- Automatically sets `latest_assignment_flag` to `true` for new assignments
- Updates previous assignments to set `latest_assignment_flag` to `false`
- Uses helper function `getActionType()` to determine action type

### Asset Assignment Cancellation (`screens/asset/asset_2.js`)
- Changed from DELETE to PUT operation
- Updates assignment with `action: "UNASSIGN"`
- Sets `latest_assignment_flag` to `false`
- Updates status to "Unassigned"

### Asset Details Display (`screens/asset/asset_2.js`)
- Added display of new fields:
  - Action
  - Action On
  - Action By
  - Latest Assignment Flag
  - Status

### API Endpoints (`config/api.js`)
- Added new endpoints:
  - `UPDATE_ASSET_ASSIGNMENT` - For updating existing assignments
  - `GET_ASSET_ASSIGNMENT_HISTORY` - For viewing assignment history
  - `GET_LATEST_ASSET_ASSIGNMENT` - For getting the latest assignment

## Action Types

The system supports the following action types:
- `ASSIGN` - When an asset is assigned to an employee
- `UNASSIGN` - When an asset assignment is cancelled
- `TRANSFER` - When an asset is transferred between employees/departments
- `RETURN` - When an asset is returned

## Usage Examples

### Creating a New Assignment
```javascript
const assignmentData = {
  asset_assign_id: "AA1234567890",
  dept_id: "DEPT001",
  asset_id: "ASSET001",
  org_id: "ORG001",
  employee_int_id: "EMP001",
  action: "ASSIGN",
  action_on: new Date().toISOString(),
  action_by: "USER001",
  latest_assignment_flag: true,
  // ... other fields
};
```

### Cancelling an Assignment
```javascript
const updateData = {
  action: "UNASSIGN",
  action_on: new Date().toISOString(),
  action_by: "USER001",
  latest_assignment_flag: false,
  status: "Unassigned"
};
```

## Database Considerations

When implementing the backend API, ensure:
1. The `latest_assignment_flag` is properly managed (only one assignment per asset should have this flag as `true`)
2. Previous assignments are updated when new assignments are created
3. Action history is maintained for audit purposes
4. Proper validation of employee_int_id, dept_id, and asset_id foreign keys 