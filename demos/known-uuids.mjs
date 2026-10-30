import UUID from "../lib/uuid.mjs";

/**
 * Null-prototype object enumerated with Windows version GUIDs
 * @see https://learn.microsoft.com/en-us/windows/win32/sbscs/application-manifests#compatibility
 * @type {Object.<string, UUID>}
 * @readonly
 */
export const WindowsGUIDs = {__proto__: null};

for(const [uuid, versions] of new Map([
	[new UUID("8e0f7a12-bfb3-4fe8-b9a5-48fd50a15a9a"), [
		"Windows 10",
		"Windows 11",
		"Windows Server 2016",
		"Windows Server 2019",
		"Windows Server 2022",
	]],
	[new UUID("{1F676C76-80E1-4239-95BB-83D0F6D0DA78}"), [
		"Windows 8.1",
		"Windows Server 2012 R2",
	]],
	[new UUID("4a2f28e3-53b9-4441-ba9c-d69d4a4a6e38"), [
		"Windows 8",
		"Windows Server 2012",
	]],
	[new UUID("35138b9a-5d96-4fbd-8e2d-a2440225f93a"), [
		"Windows 7",
		"Windows Server 2008 R2",
	]],
	[new UUID("e2011457-1546-43c5-a5fe-008deee3d3f0"), [
		"Windows Vista",
		"Windows Server 2008",
	]],
])) for(const version of versions)
	WindowsGUIDs[version] = uuid;

Object.freeze(WindowsGUIDs);
