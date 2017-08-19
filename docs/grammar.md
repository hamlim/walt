_stmt_ -> `let` **id** `;`

_stmt_ -> `let` **id** `=` _expr_ `;`

_stmt_ -> `const` **id** `=` _expr_ `;`

_stmt_ -> `export` _stmt_ `;`

_stmt_ -> _typealias_ `;`

_stmt_ -> `import` `{` **field** `:` _typedef_ `}` `from` **module** `;`

_type_ -> `i32` | `i64` | `f32` | `f64`

_typedef_ -> _type_

_typedef_ -> `anyfunc`

_typealias_ -> `type` **id** `=` _type_

_expr_ -> _expr_ `+` _term_

_expr_ -> _expr_ `-` _term_

_expr_ -> _term_

_expr_ -> **id** `(` _paramlist_ `)`

_paramlist_ -> _e_ | _paramlist_

_paramlist_ -> _param_ , _param_ | _param_

_pram_ -> **id** | _number_ | _string_

_term_ -> _term_ `*` _factor_

_term_ -> _term_ `/` _factor_

_term_ -> _factor_

_factor_ -> `(`_expr_`)`

_factor_ -> _number_

_number_ -> _number_ _integer_

_number_ -> _number_ `.` _number_

_number_ -> _e_ | _number_

_integer_ -> `0`|`1`|`2`|`3`|`4`|`5`|`6`|`7`|`8`|`9`

_string_ -> `'` _chars_ `'`

_chars_ -> _chars_ _char_

_chars_ -> _e_ | _char_

_char_ -> **UTF-8**


