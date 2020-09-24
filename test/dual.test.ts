import {assertEquals} from "https://deno.land/std@0.70.0/testing/asserts.ts";

import {Algebra, Term} from '../algebra.ts';

// The following is a list of duals from the PGA4CS paper
const exampleDuals: [Term[], Term[]][] = [
    [[1], [1, [0], [1], [2], [3]]],

    [[1, [0], [1], [2], [3]], [1]],

    [[1, [0]], [1, [1], [2], [3]]],
    [[1, [1]], [1, [0], [3], [2]]],
    [[1, [2]], [1, [0], [1], [3]]],
    [[1, [3]], [1, [0], [2], [1]]],

    [[1, [1], [2], [3]], [-1, [0]]],
    [[1, [0], [3], [2]], [-1, [1]]],
    [[1, [0], [1], [3]], [-1, [2]]],
    [[1, [0], [2], [1]], [-1, [3]]],

    [[1, [0], [1]], [1, [2], [3]]],
    [[1, [0], [2]], [1, [3], [1]]],
    [[1, [0], [3]], [1, [1], [2]]],
    [[1, [2], [3]], [1, [0], [1]]],
    [[1, [3], [1]], [1, [0], [2]]],
    [[1, [1], [2]], [1, [0], [3]]],
];

const pga3d = new Algebra(3, 0 ,1);

Deno.test("PGA3D duals match PGA4CS examples", () => {
    for(const [left, right] of exampleDuals) {
        const leftSimplified = pga3d.simplify(left);
        const rightSimplified = pga3d.simplify(right);

        assertEquals(pga3d.dual(leftSimplified), rightSimplified);
    }
});