import convertToDataloaderResult from './convertToDataloaderResult'

test("it works", () => {
    const dbResults = [
        {
            "id": 1,
        },
        {
            "id": 3,
        },
        {
            "id": 2,
        },
    ];

    expect(convertToDataloaderResult([1, 2, 3, 4], dbResults)).toEqual([
        {
            "id": 1,
        },
        {
            "id": 2,
        },
        {
            "id": 3,
        },
        null,
    ]);
})