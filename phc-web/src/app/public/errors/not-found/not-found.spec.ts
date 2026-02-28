import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { NotFound } from './not-found';

describe('NotFound', () => {
    let component: NotFound;
    let fixture: ComponentFixture<NotFound>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NotFound],
            providers: [
                provideNoopAnimations(),
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(NotFound);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render 404', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('h1')?.textContent).toContain('404');
    });
});
