import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { Unauthorized } from './unauthorized';

describe('Unauthorized', () => {
    let component: Unauthorized;
    let fixture: ComponentFixture<Unauthorized>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Unauthorized],
            providers: [
                provideNoopAnimations(),
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(Unauthorized);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render 403', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('h1')?.textContent).toContain('403');
    });
});
