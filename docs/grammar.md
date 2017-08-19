_expr_    -> _expr_ `+` _term_
           | _expr_ - _term_
           | _term_

_term_    -> _term_ `*` _factor_
           | _term_ `/` _factor_
           | _factor_

_factor_  -> **digit** | `(`_expr_`)`

